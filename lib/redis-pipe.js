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
  this._sub = redis.createClient( 6379, host, {
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


RedisPipe.prototype.unsubscribe = function(channel, handler){
  // add to listernes
  var subscribers = this._subscribers[channel];
  var idx = subscribers.indexOf(handler);
  if(idx != -1) subscribers = subscribers.splice(idx, 1);

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
    queue_name: queueMessage._queueName,
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


RedisPipe.prototype._queue = function(queueMessage, callback){
  this._pub.lpush(queueMessage._queueName, this._encodeMessage(queueMessage), function(err){
    callback(err, queueMessage);
  });
}

RedisPipe.prototype.queue = function(queueName, payload, callback){
  var queueMessage = new QueueMessage(queueName, this, payload);
  this._queue(queueMessage, callback)
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
    if(message){
      _messages.push(self._decodeMessage(message || {}));
    }
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
  this._pub.lrem(this._processingQueue(queueMessage._queueName), -1, this._encodeMessage(queueMessage), callback);
}

RedisPipe.prototype.requeue = function(queueMessage, callback){
  var self = this;
  // remove from the processing list
  this.ack(queueMessage, function(err){
    if(err) return callback(err);
    // requeue it
    self._queue(queueMessage, callback);
  });
}

RedisPipe.prototype.requeueExpired = function(queueName, duration, callback){
  this._processing(queueName, function(err, queueMessages){
    if(err) return callback(err);
    var requeues = [];

    queueMessages.forEach(function(message){
      var created = new Date( Date.parse( message.createdAt()) );
      if(Date.now() - created.getTime() > duration){
        requeues.push(message);
      }
    });

    var cnt = requeues.length;
    if(cnt == 0) return callback();

    var d = 0;
    var done = function(){
      if(++d == cnt){
        return callback();
      }
    }
    requeues.forEach(function(message){ message.requeue(done); })
  });
}


RedisPipe.prototype.length = function(queueName, inProcess, callback){
  if(typeof inProcess == "function"){
    callback = inProcess;
    inProcess = false;
  }

  var _queueName = inProcess? this._processingQueue(queueName) : queueName;

  this._pub.llen(_queueName, callback);
}

RedisPipe.prototype.flushQueue = function(queueName, callback){
  var self = this;
  this._pub.del(queueName, function(err){
    if(err) return callback(err);
    // flush the processing queue
    self._pub.del(self._processingQueue(queueName), callback);
  });
}


RedisPipe.prototype._processing = function(queueName, callback){
  var pQueue = this._processingQueue(queueName);
  var self = this;

  this.length(pQueue, function(err, len){
    if(err) return callback(err);
    self._pub.lrange(pQueue, 0, len, function(err, messages){
      if(err) return callback(err);
      var _messages = [];
      messages.forEach(function(message){
        _messages.push(self._decodeMessage(message || {}));
      });
      callback(null, _messages);
    });

  })

}




module.exports = RedisPipe;