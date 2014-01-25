var Pipe = require('./pipe'),
    util    = require('util'),
    redis   = require('redis');


var RedisPipe = function(config){
  Pipe.call(this);

  var self = this;
  this._readyCount = 0;
  this._ready = false;

  this._pub = redis.createClient( 6379, 'localhost', {
      retry_max_delay: 10000,
      max_attempts: 10000,        
      no_ready_check: true
    }
  );

  this._pub.on('error', function(e){ console.log(e); });

  this._pub.on('ready', function() {
    self._readyCount++;
    if(self._readyCount == 2){
      self.emit("ready");
    }
  });

  this._sub = redis.createClient( 6379, 'localhost', {
      retry_max_delay: 10000,
      max_attempts: 10000,        
      no_ready_check: true
    }
  );

  this._sub.on('error', function(e){ console.log(e); });

  this._sub.on('ready', function() {
    self._readyCount++;
    if(self._readyCount == 2){
      self.emit("ready");
    }
  });



  this._sub.on("message", this._onMessage.bind(this));

  this._subscribers = [];

}

util.inherits(RedisPipe, Pipe);




RedisPipe.prototype._onMessage = function(channel, message){
  try { 
    data = JSON.parse(message);
  } catch(e) {
  }

  if (data) {
    var subscribers = this._subscribers[channel] || [];
    subscribers.forEach(function(callback){
      callback(data);
    })
  }
}

RedisPipe.prototype.publish = function(event, payload){
  this._pub.publish(event, JSON.stringify(payload), function(){});
}


RedisPipe.prototype.subscribe = function(channel, callback){
  var subscribers = this._subscribers[channel];
  if(!subscribers){
    subscribers = [];
    this._subscribers[channel] = subscribers;
  }

  subscribers.push(callback);
  this._sub.subscribe(channel);
}


module.exports = RedisPipe;