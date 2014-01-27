notices
=======

[![Build Status](https://magnum.travis-ci.com/chalaschek/notices.png?token=GyZjnyzr4vfpqbuRo4tf&branch=master)](https://magnum.travis-ci.com/chalaschek/notices)

*notices* provides a simple mechanism for emitting distributed messages from objects in node. Events can be broadcast and consumed in a pub/sub like manner or emitted onto a queue.

*notices* provides a pipe framework which allows arbitrary messages systems for broadcasting events. *notices* currently provides a Redis pipe. A RabbitMQ pipe will be coming soon.

## Installation

    $ npm install notices


## Pub/Sub

The *notices* pub/sub framework extends objects with the ability to broadcast and comsume message in a pub/sub like manner.

### Examples

Coming soon.


## Queueing

The *notices* queue framework extends objects with the ability to push payloads to named queues. Consumers can then dequeue payloads from the queues.

### Reliablity

Often queues are used for workers processes. There are numerous scenarios that can lead to failures during the processing of a dequeued payload (network diruption, worker failure, etc.).

Queue reliability is dependent on the *pipe* used. Currently the redis *pipe* supports pushing queue elements onto a processing list. Once a consumer has finished processing the message, it can submit an ack and release the message for it's processing state. Additional montiors can inspect the processing list for elements that have been there for too long and requeue them if necessary.

### Methods

- queue(payload, queueName)
- dequeue(queueName, [count=1], [autoAck=false])
- ack(queueName, payload)
- length(queueName)

### Examples

Coming soon.
