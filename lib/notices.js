var events    = require('events'),
    util      = require('util'),
    mongoose  = require('mongoose');


var Notices = function(){
  // call events constructor
  events.EventEmitter.call(this);

  this._pipes = [];
}

// extend events
util.inherits(Notices, events.EventEmitter);

Notices.prototype.publish = function(channel, payload){
  payload = payload || {};

  this._pipes.forEach(function(pipe){
    pipe.publish(channel, payload);
  });

  return true;
}

Notices.prototype.subscribe = function(channel, callback){
  callback = callback || function(){}

  this._pipes.forEach(function(pipe){
    pipe.subscribe(channel, callback);
  });

  return true;
}


Notices.prototype._pubsubify = function(obj){
  if(obj.publish) throw new Error('Object already has a publish method');

  var self = this;
  obj.publish = function(){
    self.publish.apply(self, arguments);
  }

  if(obj.subscribe) throw new Error('Object already has a publish method');

  obj.subscribe = function(eventName, callback){
    self.subscribe.apply(self, arguments);
  }

}


Notices.prototype.notify = function(obj){
  var self = this;
  var _objs = (obj instanceof mongoose.Schema) ? [obj.statics, obj.methods] : [obj];

  _objs.forEach(function(_obj){ self._pubsubify( _obj ) });

  //this._queueify(obj);
}


module.exports = new Notices();