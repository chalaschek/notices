var Pipe          = require('./pipe'),
    util          = require('util'),
    redis         = require('redis'),
    QueueMessage  = require('./queue-message');


var RedisPipe = function(options){
  Pipe.call(this);

  options = options || {};

  var self = this;
  this._readyCount = 0;
  this._ready = false;

  // redis config
  var _redis = options.redis || {};
  var port = _redis.port || 6379;
  var host = _redis.host || 'localhost';
  var retry_max_delay = _redis.retry_max_delay || 10000;
  var max_attempts = _redis.max_attempts || 10000;
  var no_ready_check = (_redis.no_ready_check == null)? true : _redis.no_ready_check;


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


RedisPipe.prototype.disconnect = function( callback ){
  this._pub.quit();
  this._sub.quit();
}




/*
 * Pubsub methods
 */

// Encode a pubsub message
RedisPipe.prototype._encodePayload = function( payload ){
  return JSON.stringify(payload);
}

// Decode a queue message
RedisPipe.prototype._decodePayload = function( message ){
  var payload;
  try { 
    payload = JSON.parse(message);
  } catch(e) {}

  return payload;
}

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


// Encode a queue message
RedisPipe.prototype._encodeMessage = function( queueMessage ){
  var _payload = {
    queue_name: queueMessage.queueName(),
    created_at: queueMessage.createdAt(),
    payload: queueMessage.payload()
  }

  return JSON.stringify(_payload);
}

// Decode a queue message
RedisPipe.prototype._decodeMessage = function( message ){
  var _message;
  try { 
    _message = JSON.parse(message);
  } catch(e) {}

  var queueMessage = _message ? new QueueMessage(_message.queue_name, this, _message.payload, _message.created_at) : null;
  return queueMessage;
}


RedisPipe.prototype.queue = function(queueName, payload, callback){
  var queueMessage = new QueueMessage(queueName, this, payload);
  this._pub.lpush(queueName, this._encodeMessage(queueMessage), function(err){
    callback(err, queueMessage);
  });
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
  var _messages = [];

  decode = function(err, message){
    _messages.push(self._decodeMessage(message || {}));
    _c++;
    if(_c == count){
      callback(err, count == 1? _messages[0] : _messages);
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


RedisPipe.prototype.ack = function(queueMessage, callback){
  this._pub.lrem(this._processingQueue(queueMessage.queueName()), -1, this._encodeMessage(queueMessage), callback);
}

RedisPipe.prototype.length = function(queueName, callback){
  this._pub.llen(queueName, callback);
}

RedisPipe.prototype.flushQueue = function(queueName, callback){
  this._pub.del(queueName, callback);
}



module.exports = RedisPipe;