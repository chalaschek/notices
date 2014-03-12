notices
=======

Distributed event broadcasting and queueing for node. [![Build Status](https://travis-ci.org/chalaschek/notices.png?branch=master)](https://travis-ci.org/chalaschek/notices)

## Overview

*notices* provides a simple mechanism for emitting distributed messages from objects in node. Events can be broadcast and consumed in a pub/sub like manner or emitted onto a queue.

*notices* provides a pipe framework which allows arbitrary messages systems for broadcasting events. *notices* currently provides a Redis pipe. A RabbitMQ pipe will be coming soon.

## Installation

    $ npm install notices


## Quickstart

```js
    var notices     = require('notices')();

    // notify an object
    var obj = {};
    notices.notify(obj);

    //pubsub quickstart
    //set up consumer
    notices.subscribe("channel:obj", function(err, payload){
      // handler...
    });
    // broadcast a message
    obj.notifyPublish("channel:obj", {data:'goes here'});

    // queueing quickstart
    // queue a message
    obj.notifyQueue("queue:worker1", {data:'goes here'});
    // dequeue the message
    obj.notifyDequeue("queue:worker1", function(err, queueMessage){
      // get the payloard
      var payload = queueMessage.payload();

      // handler...

      // ack the message
      queueMessage.ack();
    });

```




## Broadcast

The *notices* broadcast framework extends objects with the ability to broadcast and comsume message in a pub/sub like manner.

### API

Coming soon.


## Queueing

The *notices* queue framework extends objects with the ability to push payloads to named queues. Consumers can then dequeue payloads from the queues.

### Reliablity

Often queues are used for workers processes. There are numerous scenarios that can lead to failures during the processing of a dequeued payload (network disruption, worker failure, etc.).

Queue reliability provided by the *pipe* used. Reliablity for the Redis *pipe* is provided by pushing queue elements onto a processing list. Once a consumer has finished processing the message, it can submit an ack and release the message for it's processing state. Additional montiors can inspect the processing list for elements that have been there for too long and requeue them if necessary.

### API

Coming soon.


## Contributors

[Chris Halaschek](https://twitter.com/chalaschek)  
[Bernardo Gomez Palacio Valdes](https://twitter.com/berngp)


## License

(The MIT License)

Copyright (c) 2014 Chris Halaschek &lt;chalaschek@gmail.com&gt;

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.