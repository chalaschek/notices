var events    = require('events'),
    util      = require('util');

var Pipe = function(){
  // call events constructor
  events.EventEmitter.call(this);
}

// extend events
util.inherits(Pipe, events.EventEmitter);

Pipe.prototype.publish = function(){
  throw new Error('Pipe#publish must be overridden by subclass');
}

Pipe.prototype.subscribe = function(){
  throw new Error('Pipe#subscribe must be overridden by subclass');
}

module.exports = Pipe;