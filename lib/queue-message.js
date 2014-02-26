var QueueMessage = function(queueName, pipe, payload, createdAt){
  this._queueName = queueName;
  // stringify payload to ensure immutability of original payload
  this._payload = JSON.stringify(payload);
  this._pipe = pipe;
  this._createdAt = createdAt || new Date();
}

QueueMessage.prototype.createdAt = function(){
  return this._createdAt;
}

QueueMessage.prototype.payload = function(){
  // parse payload and create new object to ensure immutability of original payload
  return JSON.parse(this._payload);
}

QueueMessage.prototype.ack = function(callback){
  this._pipe.ack(this, callback);
}

QueueMessage.prototype.requeue = function(callback){
  callback = callback || function(){};
  this._pipe.requeue(this, callback);
}


module.exports = QueueMessage;