var events    = require('events'),
    util      = require('util');

var Pipe = function(){
  events.EventEmitter.call(this);
}

util.inherits(Pipe, events.EventEmitter);


Pipe.prototype.disconnect = function(callback){
  throw new Error('Pipe#disconnect must be overridden by subclass');
}


/*
 * Pubsub methods
 */

Pipe.prototype.publish = function(callback){
  throw new Error('Pipe#publish must be overridden by subclass');
}

Pipe.prototype.subscribe = function(channel, callback){
  throw new Error('Pipe#subscribe must be overridden by subclass');
}

Pipe.prototype.unsubscribe = function(channel){
  throw new Error('Pipe#unsubscribe must be overridden by subclass');
}


/*
 * Queue methods
 */

Pipe.prototype.queue = function(queueName, payload, callback){
  throw new Error('Pipe#queue must be overridden by subclass');
}

Pipe.prototype.requeue = function(queueMessage, callback){
  throw new Error('Pipe#requeue must be overridden by subclass');
}

Pipe.prototype.requeueExpired = function(queueName, duration, callback){
  throw new Error('Pipe#requeueExpired must be overridden by subclass');
}

Pipe.prototype.dequeue = function(queueName, options, callback){
  throw new Error('Pipe#dequeue must be overridden by subclass');
}

Pipe.prototype.ack = function(queueMessage, callback){
  throw new Error('Pipe#ack must be overridden by subclass');
}

Pipe.prototype.length = function(queueName, inProcess, callback){
  throw new Error('Pipe#length must be overridden by subclass');
}

Pipe.prototype.flushQueue = function(queueName, callback){
  throw new Error('Pipe#flushQueue must be overridden by subclass');
}



module.exports = Pipe;