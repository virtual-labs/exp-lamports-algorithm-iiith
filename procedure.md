### Procedure

This experiment demonstrates **Lamport’s Algorithm for Mutual Exclusion** in a distributed system using an interactive simulation. Follow the steps below to perform the experiment:

---

### **1. Launch the Simulation**

- Open the simulation page in your browser.
- You will see **4 processes (P1, P2, P3, P4)** represented as nodes, connected by communication links.
- Each process can send **REQUEST**, **REPLY**, and **RELEASE** messages to others to coordinate entry into the **Critical Section (CS)**.

---

### **2. Interact with the Simulation**

You can perform the following actions manually:

- **Right-click a process** to open a context menu:
  - **Request CS**: Makes the selected process request access to the Critical Section.
  - **Release CS**: When a process is in CS, this option becomes available to release the CS.
  - **Send Reply**: If a process is holding a reply, you can manually send it.

- **Click on a link** between two processes:
  - Clicking cycles the communication link between **Normal speed** and **Slow speed**.
  - Slower links delay message delivery, simulating network latencies or faults.

- **Observe:**
  - Each process maintains a **Request Queue** (for pending REQUEST messages).
  - Each process also maintains a **Reply Queue** (for REPLY messages received).
  - Logs on the left panel display all events: CS requests, message sends/receives, releases, etc.

---

### **3. Enable Test Mode (Gamified Mode)**

- Enable **"Test Mode"** by checking the **Enable Test Mode** checkbox at the top.
- In Test Mode:
  - Processes will **randomly** request and release the CS.
  - Links will **randomly** become slow or return to normal.
  - The simulation will **pause periodically** and **ask you**:
    ➔ "**Which process will be granted CS next?**"

- **Answer Prompt:**
  - A prompt window will appear listing all process IDs.
  - Type the ID of the process you believe will be next granted the CS.
  - If correct, **you score 10 points**.
  - Otherwise, the correct process is revealed.

---

### **4. Understand Test Mode Levels**

- The experiment includes **4 test modes**, increasing in difficulty:
  - **Test Mode 1**: Only **one** process can request CS at a time.
  - **Test Mode 2**: Up to **two** processes can request CS simultaneously.
  - **Test Mode 3**: Up to **three** processes can request CS simultaneously.
  - **Test Mode 4**: All **four** processes can simultaneously request CS.

- Higher modes create more contention for CS, making prediction and understanding of Lamport’s mutual exclusion behavior more challenging.

---

### **5. Complete the Experiment**

- Continue playing until a set number of rounds or until you achieve a target score.
- Observe how Lamport’s logical clocks and message passing ensure that **only one process enters the Critical Section at a time** — even with random delays and failures.

---

## **Notes:**
- In **normal mode**, you control everything manually — allowing you to carefully step through the protocol.
- In **test mode**, the simulation introduces random events to challenge your understanding of the algorithm.
- Mutual exclusion is always maintained, even under high message delays and randomized process behavior — demonstrating the correctness of Lamport’s algorithm.
