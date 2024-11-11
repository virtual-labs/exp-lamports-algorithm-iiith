### Link your theory in here

## test

# test



### Lamport’s Distributed Mutual Exclusion 



Lamport’s distributed mutual exclusion is a distributed algorithm i.e. all participants run it on their machines. It was developed by Leslie Lamport to illustrate the concept of scalar clocks for distributed systems. 


Every site keeps a track of its local clock, and a time-stamp ordered queue Request_queue to store all CS request it has receives. Channel is FIFO. 

##Requesting the critical section
site Si wanting to enter the CS broadcasts a REQUEST(tsi, i) message to all other sites and places the request on request_queuei.
When a site Sj receives the REQUEST(tsi, i) message from site Si, it places site Si’s request on its request_queuej and returns a timestamped REPLY message to Si.

##Executing the critical section
Site Si enters the CS when the following two conditions hold:
L1: Si has received a message with timestamp larger than (tsi, i) from all
other sites.
L2: Si’s request is at the top of request_queuei.

##Releasing the critical section
• Site Si, upon exiting the CS, removes its request from the top of its request
queue and broadcasts a timestamped RELEASE message to all other sites.
• When a site Sj receives a RELEASE message from site Si, it removes Si’s
request from its request queue.

We now argue for correctness (exercise 1), fairness (exercise 2) and complexity. Note that all requests, REQUEST(tsi, i), are strictly totally ordered. This is used to break ties for clock times. 

**Correctness** : That one and only one site can access CS at a given time.
Inline Exercise 1: Show that assumption of two sites executing CS concurrently leads to contradiction. More specifically, use FIFO property of channels and strict total order among all requests to argue that assumption along with L1 & L2 implies that there is a site executing CS in presence of a smaller timestamp request in its queue (a contradiction!). 

**Fairness** : That requests are served in order of their time-stamps. 
Inline Exercise 2: Use similar argument as in Exercise 1 to show that if a site i’s request has a smaller timestamp than the request of another site j and yet site j is able to execute the CS before site i, then it leads to contradiction. 

**Complexity** 
For each CS execution, Lamport’s algorithm requires N−1 REQUEST messages, N−1 REPLY messages, and N−1 RELEASE messages. Thus, Lamport’s algorithm requires 3N−1 messages per CS invocation. 


