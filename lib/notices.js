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

  if(obj.publish) throw new Error('Object already has a publish method');
  obj.publish = function(){
    self.publish.apply(self, arguments);
  }

  if(obj.subscribe) throw new Error('Object already has a subscribe method');
  obj.subscribe = function(){
    self.subscribe.apply(self, arguments);
  }

  if(obj.unsubscribe) throw new Error('Object already has a unsubscribe method');
  obj.unsubscribe = function(){
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

Notices.prototype.dequeue = function(queueName, options, callback){
  if(this._pipe ) this._pipe.dequeue(this._queue(queueName), options, callback);
}

Notices.prototype.ack = function(queueMessage, callback){
  if(this._pipe ) this._pipe.ack(queueMessage, callback);
}

Notices.prototype.length = function(queueName, callback){
  if(this._pipe ) this._pipe.length(this._queue(queueName), callback);
}

Notices.prototype.flushQueue = function(queueName, callback){
  if(this._pipe ) this._pipe.flushQueue(this._queue(queueName), callback);
}



Notices.prototype._queueify = function(obj){
  var self = this;

  if(obj.queue) throw new Error('Object already has a queue method');
  obj.queue = function(){
    self.queue.apply(self, arguments);
  }

  if(obj.dequeue) throw new Error('Object already has a dequeue method');
  obj.dequeue = function(){
    self.dequeue.apply(self, arguments);
  }

  if(obj.ack) throw new Error('Object already has a ack method');
  obj.ack = function(){
    self.ack.apply(self, arguments);
  }

  if(obj.length) throw new Error('Object already has a length method');
  obj.length = function(){
    self.length.apply(self, arguments);
  }

  if(obj.flushQueue) throw new Error('Object already has a flushQueue method');
  obj.flushQueue = function(){
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