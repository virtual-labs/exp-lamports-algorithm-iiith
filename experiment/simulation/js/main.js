// Implements Lamport's mutual exclusion simulation with 4 processes on an HTML5 canvas.
window.addEventListener('DOMContentLoaded', () => {
  // Constants
  const NODE_RADIUS = 60;
  const BASE_TRAVEL_TIME = 5000; // ms
  const LINK_MULTIPLIERS = [1, 4]; // normal, slow
  const NODE_COLORS = { idle: '#888', requesting: '#ff0', inCS: '#0f0' };
  const MSG_COLORS = { REQUEST: '#00f', REPLY: '#0f0', RELEASE: '#a0f' };
  // Globals
  let currentTestMode = 0;  // Starts with Test Mode 1
  let userAnswer = null;  // User's answer to the question
  let userScore = 0;  // User score

  // Canvas setup
  const canvas = document.getElementById('sim-canvas');
  const canvasPanel = document.getElementById('canvas-panel');
  const ctx = canvas.getContext('2d');
  function resizeCanvas() {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  // UI elements
  const contextMenu = document.getElementById('context-menu');
  let contextTarget = null;
  const playPauseBtn = document.getElementById('play-pause-btn');
  const stepBtn = document.getElementById('step-btn');
  const resetBtn = document.getElementById('reset-btn');
  const randomDelaysChk = document.getElementById('random-delays-chk');
  const processSelect = document.getElementById('process-select');
  const requestCsBtn = document.getElementById('request-cs-btn');
  const statePanel = document.getElementById('state-panel');
  const logPanel = document.getElementById('log-panel');
  const testModeToggle = document.getElementById('test-mode-toggle');

  // Node positions
  const nodePositions = {
    P1: { x: NODE_RADIUS * 2, y: NODE_RADIUS * 2 },
    P2: { x: canvas.width - NODE_RADIUS * 2, y: NODE_RADIUS * 2 },
    P3: { x: canvas.width - NODE_RADIUS * 2, y: canvas.height - NODE_RADIUS * 2 },
    P4: { x: NODE_RADIUS * 2, y: canvas.height - NODE_RADIUS * 2 }
  };

  // Link states: key = "P1-P2", etc.
  let linkStates = {};
  const procs = Object.keys(nodePositions);
  for (let i = 0; i < procs.length; i++) {
    for (let j = i + 1; j < procs.length; j++) {
      linkStates[`${procs[i]}-${procs[j]}`] = 0; // normal
    }
  }

  function getLinkKey(a, b) {
    return a < b ? `${a}-${b}` : `${b}-${a}`;
  }

  // Logging
  function log(msg) {
    const entry = document.createElement('div');
    entry.className = 'log-entry';
    entry.textContent = msg;
    logPanel.appendChild(entry);
    logPanel.scrollTop = logPanel.scrollHeight;
  }

  // Message class
  class Message {
    constructor(type, from, to, timestamp, travelDuration) {
      this.type = type;
      this.from = from;
      this.to = to;
      this.timestamp = timestamp;
      this.travelDuration = travelDuration;
      this.elapsed = 0;
    }
  }

  // Process class
  class Process {
    constructor(id) {
      this.id = id;
      this.clock = 0;
      this.state = 'idle';
      this.requestTimestamp = null;
      this.repliesReceived = new Set();
      this.deferredReplies = [];
      this.requestQueue = [];
    }

    incrementClock(receivedTs = null) {
      if (receivedTs !== null) {
        this.clock = Math.max(this.clock, receivedTs) + 1;
      } else {
        this.clock += 1;
      }
      return this.clock;
    }

    broadcast(type) {
      for (const otherId of procs) {
        if (otherId === this.id) continue;
        sendMessage(type, this.id, otherId, this.clock);
      }
    }

    requestCS() {
      if (this.state === 'inCS') { log(`${this.id} already in CS`); return; }
      this.incrementClock();
      this.state = 'requesting';
      this.requestTimestamp = this.clock;
      this.repliesReceived.clear();
      this.repliesReceived.add(this.id);
      this.requestQueue.push({ id: this.id, ts: this.requestTimestamp });
      this.sortQueue();
      log(`[${this.id}] requests CS at ${this.requestTimestamp}`);
      this.broadcast('REQUEST');
    }

    onReceive(msg) {
      this.incrementClock(msg.timestamp);
      if (msg.type === 'REQUEST') {
        this.requestQueue.push({ id: msg.from, ts: msg.timestamp });
        this.sortQueue();
        const myReq = this.requestTimestamp;
        const defer = this.state === 'inCS' ||
                      (this.state === 'requesting' &&
                       ((myReq < msg.timestamp) ||
                        (myReq === msg.timestamp && this.id < msg.from)));
        if (defer) {
          this.deferredReplies.push(msg.from);
          log(`[${this.id}] defers REPLY to ${msg.from}`);
        } else {
          this.sendReply(msg.from);
        }
      } else if (msg.type === 'REPLY') {
        this.repliesReceived.add(msg.from);
        log(`[${this.id}] received REPLY from ${msg.from}`);
      } else if (msg.type === 'RELEASE') {
        this.requestQueue = this.requestQueue.filter(r => r.id !== msg.from);
        log(`[${this.id}] processed RELEASE from ${msg.from}`);
      }
      this.checkEnterCS();
    }

    sendReply(toId) {
      sendMessage('REPLY', this.id, toId, this.clock);
      log(`[${this.id}] sends REPLY to ${toId}`);
    }

    checkEnterCS() {
      if (this.state === 'requesting' &&
          this.repliesReceived.size === procs.length &&
          this.requestQueue.length &&
          this.requestQueue[0].id === this.id) {
        this.enterCS();
      }
    }

    enterCS() {
      this.state = 'inCS';
      log(`[${this.id}] enters CS`);
      updateRequestCsButton();
      if (currentTestMode && userAnswer) {
        sim.playing = false;
        if (userAnswer === this.id) {
          userScore += 10;
          alert(`Correct! ${this.id} is in CS.`);
        }
        else {
          userScore = Math.max(0, userScore - 2);
          alert(`Incorrect! ${this.id} is not in CS.`);
        }
        currentTestMode = 1 + Math.floor(userScore / 40);
        userAnswer = null;  // Reset user answer for the next question
        sim.playing = true;
        lastTime = performance.now();
      }
    }

    releaseCS() {
      if (this.state !== 'inCS') return;
      this.incrementClock();
      this.state = 'idle';
      this.requestQueue = this.requestQueue.filter(r => r.id !== this.id);
      log(`[${this.id}] releases CS at ${this.clock}`);
      this.broadcast('RELEASE');
      // send deferred replies
      while (this.deferredReplies.length) {
        const toId = this.deferredReplies.shift();
        this.sendReply(toId);
      }
      this.requestTimestamp = null;
      this.repliesReceived.clear();
      updateRequestCsButton();
    }

    sortQueue() {
      this.requestQueue.sort((a, b) => a.ts - b.ts || a.id.localeCompare(b.id));
    }
  }

  // Simulator class
  class Simulator {
    constructor() {
      this.processes = {};
      for (const id of procs) this.processes[id] = new Process(id);
      this.messages = [];
      this.randomDelays = false;
      this.playing = false;
    }

    update(dt) {
      // advance message animations & deliver
      for (const msg of this.messages) msg.elapsed += dt;
      this.deliverDue();
    }

    deliverDue() {
      const due = this.messages.filter(m => m.elapsed >= m.travelDuration);
      for (const msg of due) {
        this.messages.splice(this.messages.indexOf(msg), 1);
        this.processes[msg.to].onReceive(msg);
      }
    }

    step() {
      if (!this.messages.length) return;
      // pick message with smallest remaining time
      let nextMsg = this.messages.reduce((a, b) => {
        const ra = a.travelDuration - a.elapsed;
        const rb = b.travelDuration - b.elapsed;
        return ra < rb ? a : b;
      });
      nextMsg.elapsed = nextMsg.travelDuration;
      this.deliverDue();
    }

    reset() {
      for (const key in linkStates) linkStates[key] = 0;
      this.processes = {};
      for (const id of procs) this.processes[id] = new Process(id);
      this.messages = [];
      this.playing = false;
      logPanel.textContent = '';
      playPauseBtn.textContent = 'Play';
    }
  }

  // Create simulator
  let sim = new Simulator();

  // Send message helper
  function sendMessage(type, from, to, timestamp) {
    const key = getLinkKey(from, to);
    const linkState = linkStates[key];
    const multiplier = LINK_MULTIPLIERS[linkState];
    let travel = BASE_TRAVEL_TIME * multiplier;
    if (sim.randomDelays && isFinite(travel)) {
      travel *= (1 + Math.random() * 2);
    }
    const msg = new Message(type, from, to, timestamp, travel);
    sim.messages.push(msg);
    log(`[${from}] sends ${type}(${timestamp}) to ${to}`);
  }

  // Rendering
  function render() {
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    // draw links
    ctx.lineWidth = 2;
    for (const key in linkStates) {
      const [a, b] = key.split('-');
      const { x: x1, y: y1 } = nodePositions[a];
      const { x: x2, y: y2 } = nodePositions[b];
      const state = linkStates[key];
      if (state === 0) ctx.strokeStyle = '#aaa';
      else ctx.strokeStyle = '#fa0';
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
    // draw messages
    for (const m of sim.messages) {
      const fromPos = nodePositions[m.from];
      const toPos = nodePositions[m.to];
      const frac = Math.min(m.elapsed / m.travelDuration, 1);
      const x = fromPos.x + (toPos.x - fromPos.x) * frac;
      const y = fromPos.y + (toPos.y - fromPos.y) * frac;
      ctx.fillStyle = MSG_COLORS[m.type];
      ctx.beginPath();
      ctx.arc(x, y, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.save();
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '13px Arial';
      ctx.fillText(m.type, x, y);
      ctx.restore();
    }
    // draw nodes
    for (const id in sim.processes) {
      const p = sim.processes[id];
      const pos = nodePositions[id];
      ctx.fillStyle = NODE_COLORS[p.state];
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, NODE_RADIUS, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.stroke();
      ctx.fillStyle = '#000';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '16px Arial';
      ctx.fillText(id + ' (' + p.clock + ')', pos.x, pos.y);
      ctx.fillText(`${p.state}`, pos.x, pos.y + 20);
    }
    // draw user score if in test mode
    if (currentTestMode) {
      ctx.save();
      ctx.fillStyle = 'white';
      ctx.font = '24px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(`Your Score: ${userScore}`, canvas.width/2, 20);
      ctx.fillText(`Next Test Mode at score: ${40 * currentTestMode}`, canvas.width/2, 50);
      ctx.restore();
    }
    updateStatePanel();
  }

  // Animation loop
  let lastTime = performance.now();
  function animate(time) {
    const dt = time - lastTime;
    lastTime = time;
    if (sim.playing) sim.update(dt);
    render();
    requestAnimationFrame(animate);
  }
  requestAnimationFrame(animate);

  // UI event handlers

  // Canvas click: detect node or link
  canvas.addEventListener('mousedown', e => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    // node detection
    for (const id in nodePositions) {
      const pos = nodePositions[id];
      const dx = x - pos.x, dy = y - pos.y;
      if (Math.hypot(dx, dy) < NODE_RADIUS) {
        // show context menu
        contextTarget = id;
        const panelRect = canvasPanel.getBoundingClientRect();
        const relX = e.clientX - panelRect.left;
        const relY = e.clientY - panelRect.top;
        contextMenu.style.left = relX + 'px';
        contextMenu.style.top  = relY + 'px';
        contextMenu.style.display = 'block';
        return;
      }
    }
    // link detection
    for (const key in linkStates) {
      const [a, b] = key.split('-');
      const p1 = nodePositions[a], p2 = nodePositions[b];
      // point-line distance
      const t = ((x-p1.x)*(p2.x-p1.x)+(y-p1.y)*(p2.y-p1.y)) /
                ((p2.x-p1.x)**2+(p2.y-p1.y)**2);
      if (t >= 0 && t <= 1) {
        const projX = p1.x + t*(p2.x-p1.x);
        const projY = p1.y + t*(p2.y-p1.y);
        const dist = Math.hypot(x-projX, y-projY);
        if (dist < 6) {
          // toggle link
          linkStates[key] = (linkStates[key] + 1) % LINK_MULTIPLIERS.length;
          const state = linkStates[key];
          if (state === 0) log(`Link ${key} → normal speed`);
          else if (state === 1) log(`Link ${key} → slowed`);
          else log(`Link ${key} → halted`);
          // adjust any in-flight messages on this link
          sim.messages.forEach(msg => {
            if (getLinkKey(msg.from, msg.to) === key) {
              const multiplier = LINK_MULTIPLIERS[linkStates[key]];
              const newTotal = BASE_TRAVEL_TIME * multiplier;
              // preserve fraction already traveled
              const frac = msg.elapsed / msg.travelDuration;
              msg.travelDuration = newTotal;
              msg.elapsed = frac * newTotal;
            }
          });
          return;
        }
      }
    }
    // otherwise hide context menu
    contextMenu.style.display = 'none';
  });

  // Context menu action
  contextMenu.addEventListener('click', e => {
    const action = e.target.dataset.action;
    const proc = sim.processes[contextTarget];
    if (action === 'request') proc.requestCS();
    else if (action === 'release') proc.releaseCS();
    else if (action === 'reply') {
      if (proc.deferredReplies.length) proc.sendReply(proc.deferredReplies.shift());
    }
    contextMenu.style.display = 'none';
  });

  // Control panel
  playPauseBtn.addEventListener('click', () => {
    sim.playing = !sim.playing;
    playPauseBtn.textContent = sim.playing ? 'Pause' : 'Play';
  });
  stepBtn.addEventListener('click', () => sim.step());
  resetBtn.addEventListener('click', () => sim.reset());
  randomDelaysChk.addEventListener('change', e => {
    sim.randomDelays = e.target.checked;
  });
  requestCsBtn.addEventListener('click', () => {
    const val = processSelect.value;
    if (!val) return;
    const proc = sim.processes[val];
    if (proc.state === 'inCS') proc.releaseCS();
    else proc.requestCS();
    updateRequestCsButton();
  });
  // requestCsBtn.addEventListener('click', () => {
  //   const val = processSelect.value;
  //   if (val) sim.processes[val].requestCS();
  // });

  function updateStatePanel() {
    let html = '';
    for (const id in sim.processes) {
      const p = sim.processes[id];
      // Format queues as comma-separated strings
      const reqs = p.requestQueue
        .map(r => `${r.id}(${r.ts})`)
        .join(', ') || '—';
      const repliesReceived = [...p.repliesReceived].join(', ') || '—';
      html += `
        <div style="margin-bottom: 12px;">
          <strong>${id}</strong> (clock: ${p.clock})<br>
          <em>Request Queue:</em> ${reqs}<br>
          <em>Replies received:</em> ${repliesReceived}<br>
        </div>
      `;
    }
    statePanel.innerHTML = html;
  }


  processSelect.addEventListener('change', updateRequestCsButton);
  function updateRequestCsButton() {
    const sel = processSelect.value;
    if (sel && sim.processes[sel].state === 'inCS') {
      requestCsBtn.textContent = 'Release CS';
    } else {
      requestCsBtn.textContent = 'Request CS';
    }
  }


  testModeToggle.addEventListener('change', (e) => {
    if (e.target.checked) startTestMode();
    else resetTestMode();
  });

  function startTestMode() {
    userScore = userScore || 0;
    currentTestMode = 1;
  }

  function resetTestMode() {
    userScore = userScore || 0;
    currentTestMode = 0;
  }

  function randomRequest() {
    const available = [];
    const all = Object.values(sim.processes);
    for (const id in sim.processes) {
      const proc = sim.processes[id];
      if (proc.state === 'idle') available.push(proc);
    }
    const numUnavailable = all.length - available.length;
    if (numUnavailable >= currentTestMode) return;
    const selected = available[Math.floor(Math.random() * available.length)];
    selected.requestCS();
  }

  function randomRelease() {
    const available = [];
    for (const id in sim.processes) {
      const proc = sim.processes[id];
      if (proc.state === 'inCS') available.push(proc);
    }
    const selected = available[Math.floor(Math.random() * available.length)];
    selected.releaseCS();
  }

  function askQuestion() {
    if (userAnswer) return;
    const available = [];
    for (const id in sim.processes) {
      const proc = sim.processes[id];
      if (proc.state === 'requesting') available.push(proc);
    }
    if (available.length === 0) return;
    sim.playing = false;
    userAnswer = prompt(`Which process will be granted CS next?`).toUpperCase();
    sim.playing = true;
    lastTime = performance.now();
  }

  setInterval(() => {
    if (currentTestMode) randomRequest();
  }, Math.random() * 5000 + 1000);

  setInterval(() => {
    if (currentTestMode) randomRelease();
  }, Math.random() * 5000 + 1000);

  setInterval(() => {
    if (currentTestMode) askQuestion();
  }, Math.random() * 10000 + 5000);
});
