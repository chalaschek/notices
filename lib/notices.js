var events    = require('events'),
    util      = require('util');


var Notices = function(){
  // call events constructor
  events.EventEmitter.call(this);

  this._channels = [];
}

// extend events
util.inherits(Notices, events.EventEmitter);




Notices.prototype.publish = function(eventName, payload){
  var split = eventName.split(':');
  if (split.length!=2) {
    console.log("eventName '%s' is incorrect", eventName);
    return false;
  }

  var context = split[0];
  var event = split[1];

  this.channels.forEach(function(channel){
    channel.publish(context, event, payload);
  });

}


Notices.prototype.subscribe = function(eventName, callback){
  var split = eventName.split(':');
  if (split.length!=2) {
    console.log("eventName '%s' is incorrect", eventName);
    return false;
  }

  var context = split[0];
  var event = split[1];

  this.channels.forEach(function(channel){
    channel.subscribe(context, event, callback);
  });

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
  this._pubsubify(obj);
  //this._queueify(obj);
}


module.exports = new Notices();