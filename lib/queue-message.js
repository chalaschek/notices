var QueueMessage = function(queueName, pipe, payload, createdAt){
  this._queueName = queueName;
  this._payload = payload;
  this._pipe = pipe;
  this._createdAt = createdAt || new Date();
}

QueueMessage.prototype.createdAt = function(){
  return this._createdAt;
}

QueueMessage.prototype.payload = function(){
  return this._payload;
}

QueueMessage.prototype.ack = function(callback){
  this._pipe.ack(this, callback);
}


module.exports = QueueMessage;