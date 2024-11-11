

# Lamport’s Distributed Mutual Exclusion 



Lamport’s distributed mutual exclusion is a distributed algorithm i.e. all participants run it on their machines. It was developed by Leslie Lamport to illustrate the concept of scalar clocks for distributed systems. 


Every site keeps a track of its local clock, and a time-stamp ordered queue Request_queue to store all CS request it has receives. Channel is FIFO. 

## Algorithm 

### Requesting the critical section
site S<sub>i</sub> wanting to enter the CS broadcasts a REQUEST(ts<sub>i</sub>, i) message to all other sites and places the request on request_queue<sub>i</sub>.
When a site S<sub>j</sub> receives the REQUEST(ts<sub>i</sub>, i) message from site S<sub>i</sub>, it places site S<sub>i</sub>’s request on its request_queue<sub>j</sub> and returns a timestamped REPLY message to S<sub>i</sub>.

### Executing the critical section
Site S<sub>i</sub> enters the CS when the following two conditions hold:
L1: S<sub>i</sub> has received a message with timestamp larger than (ts<sub>i</sub>, i) from all
other sites.
L2: S<sub>i</sub>’s request is at the top of request_queue<sub>i</sub>.

### Releasing the critical section  <br />
1. Site S<sub>i</sub>, upon exiting the CS, removes its request from the top of its request
queue and broadcasts a timestamped RELEASE message to all other sites.  <br />
2. When a site S<sub>j</sub> receives a RELEASE message from site S<sub>i</sub>, it removes S<sub>i</sub>’s
request from its request queue.  <br />

## Analysis

We now argue for correctness (exercise 1), fairness (exercise 2) and complexity. Note that all requests, REQUEST(ts<sub>i</sub>, i), are strictly totally ordered. This is used to break ties for clock times. 

### **Correctness** : That one and only one site can access CS at a given time.  <br />
*Inline Exercise 1*: Show that assumption of two sites executing CS concurrently leads to contradiction. More specifically, use FIFO property of channels and strict total order among all requests to argue that assumption along with L1 & L2 implies that there is a site executing CS in presence of a smaller timestamp request in its queue (a contradiction!). 

### **Fairness** : That requests are served in order of their time-stamps. 
*Inline Exercise 2*: Use similar argument as in Exercise 1 to show that if a site i’s request has a smaller timestamp than the request of another site j and yet site j is able to execute the CS before site i, then it leads to contradiction. 

### **Complexity** 
For each CS execution, Lamport’s algorithm requires N−1 REQUEST messages, N−1 REPLY messages, and N−1 RELEASE messages. Thus, Lamport’s algorithm requires 3N−1 messages per CS invocation. 


