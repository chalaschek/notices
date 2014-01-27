var Pipe = require('./pipe'),
    util    = require('util'),
    redis   = require('redis');


var RedisPipe = function(options){
  Pipe.call(this);

  options = options || {};

  var self = this;
  this._readyCount = 0;
  this._ready = false;

  // redis config
  var port = options.port || 6379;
  var host = options.host || 'localhost';
  var retry_max_delay = options.retry_max_delay || 10000;
  var max_attempts = options.max_attempts || 10000;
  var no_ready_check = (options.no_ready_check == null)? true : options.no_ready_check;


  // init publisher connection
  this._pub = redis.createClient( port, host, {
      retry_max_delay: retry_max_delay,
      max_attempts: max_attempts,
      no_ready_check: no_ready_check
    }
  );

  this._pub.on('error', function(e){ console.log(e); });

  this._pub.on('ready', function() {
    self._readyCount++;
    if(self._readyCount == 2){
      self.emit("ready");
    }
  });


  // init subscriber connection
  this._sub = redis.createClient( 6379, 'localhost', {
      retry_max_delay: retry_max_delay,
      max_attempts: max_attempts,
      no_ready_check: no_ready_check
    }
  );

  this._sub.on('error', function(e){ console.log(e); });
  this._sub.on('ready', function() {
    self._readyCount++;
    if(self._readyCount == 2){
      self.emit("ready");
    }
  });

  // init subscriber listeners
  this._subscribers = [];
  this._subSubscriptions = {};

  // route published message
  this._sub.on("message", this._onMessage.bind(this));
}

// extend pipe
util.inherits(RedisPipe, Pipe);





// If the `doc` is not a string it will convert it to its JSON equivalent.###
RedisPipe.prototype._encodePayload = function( payload ){
  var _payload = payload;
  if(typeof _payload == "string"){
    return _payload;
  }
  _payload = JSON.stringify(payload);
  return _payload;
}


RedisPipe.prototype._decodePayload = function( message ){
  var data;
  try { 
    data = JSON.parse(message);
  } catch(e) {
  }

  return data;
}



/*
 * Pubsub methods
 */

RedisPipe.prototype._onMessage = function(channel, message){
  var data = this._decodePayload(message);
  
  if (data) {
    var subscribers = this._subscribers[channel] || [];
    subscribers.forEach(function(callback){
      callback(data);
    })
  }
}

RedisPipe.prototype.publish = function(event, payload, callback){
  callback = callback || function(){}
  // simply publish message via redis connection
  this._pub.publish(event, this._encodePayload(payload), callback);
}


RedisPipe.prototype.subscribe = function(channel, callback){
  // add to listernes
  var subscribers = this._subscribers[channel];
  if(!subscribers){
    subscribers = [];
    this._subscribers[channel] = subscribers;
  }

  subscribers.push(callback);

  // register the subscribe with redis if not already added

  if(!this._subSubscriptions[channel]){
    this._subSubscriptions[channel] = true;
    this._sub.subscribe(channel);
  }
}




/*
 * Queue methods
 */

RedisPipe.prototype.queue = function(queueName, payload, callback){
  this._pub.lpush(queueName, this._encodePayload(payload), callback);
}


RedisPipe.prototype._processingQueue = function(queueName){
  return queueName + ":_notices_processing_";
}

RedisPipe.prototype.dequeue = function(queueName, options, callback){
  if(typeof options == "function"){
    callback = options;
    options = {};
  }

  var self = this;
  var count = options.count || 1;
  var autoAck = options.auto_ack == null ? false : options.auto_ack;
  var block = options.block == null ? false : options.block;

  var _c = 0;
  var _payloads = [];

  decode = function(err, message){
    _payloads.push(self._decodePayload(message || {}));
    _c++;
    if(_c == count){
      callback(err, count == 1? _payloads[0] : _payloads);
    }
  }

  for(var i = 0; i < count; i++){
    if(block){
      if(autoAck){
        this._pub.brpop(queueName, 0, decode);
      }else{
        this._pub.brpoplpush(queueName, this._processingQueue(queueName), 0, decode);
      }
    }else{
      if(autoAck){
        this._pub.rpop(queueName, decode);
      }else{
        this._pub.rpoplpush(queueName, this._processingQueue(queueName), decode);
      }
    }
  }
}


RedisPipe.prototype.ack = function(queueName, payload, callback){
  this._pub.lrem(this._processingQueue(queueName), -1, this._encodePayload(payload), callback);
}

RedisPipe.prototype.length = function(queueName, callback){
  this._pub.llen(queueName, callback);
}

RedisPipe.prototype.flushQueue = function(queueName, callback){
  this._pub.del(queueName, callback);
}



module.exports = RedisPipe;