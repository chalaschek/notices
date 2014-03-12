var events    = require('events'),
    util      = require('util'),
    mongoose  = require('mongoose'),
    RedisPipe = require('./redis-pipe');


var Notices = function(options){
  // call events constructor
  events.EventEmitter.call(this);
  this.options = options || {};
  var pipe = this.options.pipe;
  if(pipe){
    this._pipe = pipe;
    return;
  }

  this._pipe = new RedisPipe(this.options)
}

// extend events
util.inherits(Notices, events.EventEmitter);

/* Pipe methods */

Notices.prototype.setPipe = function(pipe){
  this._pipe = pipe
}

Notices.prototype.disconnect = function(){
  if(this._pipe) this._pipe.disconnect();
}


/* Pubsub methods */

Notices.prototype._channel = function(channel){
  // prepend with namespace
  return "notices.channel." + (this.options.namespace ? this.options.namespace + "." : "" ) + channel;
}

Notices.prototype.publish = function(channel, payload, callback){
  callback = callback || function(){}
  if(this._pipe ) this._pipe.publish(this._channel(channel), payload, callback);
}

Notices.prototype.subscribe = function(channel, handler){
  handler = handler || function(){}
  if(this._pipe ) this._pipe.subscribe(this._channel(channel), handler);
}

Notices.prototype.unsubscribe = function(channel, handler){
  if(this._pipe ) this._pipe.unsubscribe(this._channel(channel), handler);
}


Notices.prototype._pubsubify = function(obj){
  var self = this;

  if(obj.notifyPublish) throw new Error('Object already has a notifyPublish method');
  obj.notifyPublish = function(){
    self.publish.apply(self, arguments);
  }

  if(obj.notifySubscribe) throw new Error('Object already has a notifySubscribe method');
  obj.notifySubscribe = function(){
    self.subscribe.apply(self, arguments);
  }

  if(obj.notifyUnsubscribe) throw new Error('Object already has a notifyUnsubscribe method');
  obj.notifyUnsubscribe = function(){
    self.unsubscribe.apply(self, arguments);
  }

}


/* Queue methods */

Notices.prototype._queue = function(queueName){
  // prepend with namespace
  return "notices.queue." + (this.options.namespace ? this.options.namespace + "." : "" ) + queueName;
}


Notices.prototype.queue = function(queueName, payload, callback){
  callback = callback || function(){};
  if(this._pipe ) this._pipe.queue(this._queue(queueName), payload, callback);
}

Notices.prototype.requeue = function(queueMessage, callback){
  callback = callback || function(){};
  if(this._pipe ) this._pipe.requeue(queueMessage, callback);
}

Notices.prototype.requeueExpired = function(queueName, duration, callback){
  callback = callback || function(){};
  if(this._pipe ) this._pipe.requeueExpired(this._queue(queueName), duration, callback);
}

Notices.prototype.dequeue = function(queueName, options, callback){
  if(this._pipe ) this._pipe.dequeue(this._queue(queueName), options, callback);
}

Notices.prototype.ack = function(queueMessage, callback){
  if(this._pipe ) this._pipe.ack(queueMessage, callback);
}

Notices.prototype.length = function(queueName, inProcess, callback){
  if(this._pipe ) this._pipe.length(this._queue(queueName), inProcess, callback);
}

Notices.prototype.flushQueue = function(queueName, callback){
  if(this._pipe ) this._pipe.flushQueue(this._queue(queueName), callback);
}



Notices.prototype._queueify = function(obj){
  var self = this;

  if(obj.notifyQueue) throw new Error('Object already has a notifyQueue method');
  obj.notifyQueue = function(){
    self.queue.apply(self, arguments);
  }

  if(obj.notifyRequeue) throw new Error('Object already has a notifyRequeue method');
  obj.notifyRequeue = function(){
    self.requeue.apply(self, arguments);
  }

  if(obj.notifyRequeueExpired) throw new Error('Object already has a notifyRequeueExpired method');
  obj.notifyRequeueExpired = function(){
    self.requeueExpired.apply(self, arguments);
  }

  if(obj.notifyDequeue) throw new Error('Object already has a notifyDequeue method');
  obj.notifyDequeue = function(){
    self.dequeue.apply(self, arguments);
  }

  if(obj.notifyAck) throw new Error('Object already has a notifyAck method');
  obj.notifyAck = function(){
    self.ack.apply(self, arguments);
  }

  if(obj.notifyLength) throw new Error('Object already has a notifyLength method');
  obj.notifyLength = function(){
    self.length.apply(self, arguments);
  }

  if(obj.notifyFlushQueue) throw new Error('Object already has a notifyFlushQueue method');
  obj.notifyFlushQueue = function(){
    self.flushQueue.apply(self, arguments);
  }
}





Notices.prototype.notify = function(obj){
  var self = this;
  var _objs = (obj instanceof mongoose.Schema) ? [obj.statics, obj.methods] : [obj];

  _objs.forEach(function(_obj){ self._pubsubify( _obj ) });

  _objs.forEach(function(_obj){ self._queueify( _obj ) });
}


module.exports = Notices;