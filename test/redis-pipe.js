var should            = require('should'),
    Pipe           = require('../lib/pipe'),
    notices        = require('../index')(),
    RedisPipe      = require('../lib/redis-pipe');

describe('Redis Pipe', function(){
  var redisPipe;

  before(function(){
    redisPipe = new RedisPipe();
  });

  after(function(){
    notices.disconnect();
  });


  it('should subsclass Pipe', function(){
    (RedisPipe.super_ == Pipe).should.be.ok;
  });


  describe('Connections', function(){
    var conn;
    before(function(){
      conn = new RedisPipe();
    });

    it('should connect', function(){
      should.exist(conn);
    });

    it('should disconnect', function(){
      conn.disconnect();
    });
  });


  describe('Pubsub', function(){
    it('subsribers should receive published messages', function(done){
      var _count = 0;
      var err;

      doneCheck = function(){
        _count++;
        if(_count == 3 && !err)
          done();
      }

      notices.subscribe('test:event', doneCheck);

      notices.subscribe('test:event', doneCheck);

      notices.subscribe(':error', function(data){
        err = new Error("Invalid message");
        done(err);
      });

      notices.publish('test:event', {}, function(err){
        should.not.exist(err);
        doneCheck();
      });
    });

    it('should unsubscribe handlers', function(done){
      var d = function(){
        false.shoud.not.be.ok;
      }
      notices.subscribe('test:unsub', d);

      notices.unsubscribe('test:unsub', d);

      notices.publish('test:unsub', {}, function(err){
        setTimeout(function(){
          done();
        }, 500)
      });
    });
  });

  
  describe('Queue', function(){
    var payload;
    var testQueue = "_test_notices:test";
    var queueMessage;

    before(function(){
      payload = { time: Date.now() };
    });

    after(function(done){
      notices.flushQueue(testQueue, function(){
        notices.flushQueue(redisPipe._processingQueue(testQueue), function(){
          done()
        });
      });
    });

    it('should queue a payload', function(done){
      notices.queue(testQueue, payload, function(err, queueMessage){
        should.not.exist(err);
        should.exist(queueMessage);
        done()
      });
    });

    it('should return the length of the queue', function(done){
      notices.length(testQueue, function(err, cnt){
        should.not.exist(err);
        should.exist(cnt);
        cnt.should.eql(1);
        done();
      })
    });

    it('should return the length of the processing queue', function(done){
      notices.length(testQueue, true, function(err, cnt){
        should.not.exist(err);
        should.exist(cnt);
        cnt.should.eql(0);
        done();
      })
    });



    it('should dequeue a payload', function(done){
      notices.dequeue(testQueue, function(err, _queueMessage){
        should.not.exist(err);
        should.exist(_queueMessage);
        queueMessage = _queueMessage;
        queueMessage.payload().time.should.eql(payload.time);
        done();
      });
    });

    it('should push the payload onto a processing queue (autoack off by default)', function(done){
      redisPipe._pub.llen(redisPipe._processingQueue(queueMessage._queueName), function(err, cnt){
        should.not.exist(err);
        should.exist(cnt);
        cnt.should.eql(1);
        done();
      })
    });

    it('should ack the processing queue', function(done){
      notices.ack(queueMessage, function(err){
        should.not.exist(err);
        redisPipe._pub.llen(redisPipe._processingQueue(queueMessage._queueName), function(err, cnt){
          should.not.exist(err);
          should.exist(cnt);
          cnt.should.eql(0);
          done();
        })
      });
    });

    it('should ack the processing queue even if the message payload is changed', function(done){
      notices.queue(testQueue, payload, function(err, _queueMessage){
        notices.dequeue(testQueue, function(err, _queueMessage){
          should.not.exist(err);
          should.exist(_queueMessage);
          var payload = _queueMessage.payload();
          payload.changed = true;
          notices.ack(_queueMessage, function(err){
            should.not.exist(err);
            redisPipe._pub.llen(redisPipe._processingQueue(_queueMessage._queueName), function(err, cnt){
              should.not.exist(err);
              should.exist(cnt);
              cnt.should.eql(0);
              done();
            })
          });
        });
      });
    });


    it('should support auto-acking', function(done){
      notices.queue(testQueue, payload, function(err, queueMessage){
        should.not.exist(err);
        should.exist(queueMessage);

        notices.dequeue(testQueue, {auto_ack: true}, function(err, queueMessage){
          should.not.exist(err)
          should.exist(queueMessage);

          redisPipe._pub.llen(redisPipe._processingQueue(testQueue), function(err, cnt){
            should.not.exist(err);
            should.exist(cnt);
            cnt.should.eql(0);
            done();
          })
        });
      });
    });


    it('should support dequeing n payloads', function(done){
      notices.queue(testQueue, payload, function(err, queueMessage){
        should.not.exist(err);
        should.exist(queueMessage);

        notices.queue(testQueue, payload, function(err, queueMessage){
          should.not.exist(err);
          should.exist(queueMessage);

          notices.dequeue(testQueue, {auto_ack: true, count: 2}, function(err, queueMessages){
            should.not.exist(err)
            should.exist(queueMessages);
            (queueMessages instanceof Array).should.be.ok;
            done();
          });
        });
      });
    });


    describe("Requeueing", function(){
      var message;
      notices.flushQueue(testQueue);
      before(function(done){
        notices.queue(testQueue, payload, function(err, queueMessage){
          should.not.exist(err);
          should.exist(queueMessage);
          message = queueMessage;
          notices.dequeue(testQueue, function(err, queueMessage){
            should.not.exist(err);
            done();
          });
        });
      });

      it('should requeue messages', function(done){

        // requeue it!
        notices.requeue(message, function(err){
          should.not.exist(err);
          notices.dequeue(testQueue, function(err, _message){
            should.not.exist(err);
            should.exist(_message);
            done();
          });
        });
      });


      it('should remove only remove original message from processing queue', function(done){
        notices._pipe._pub.llen(redisPipe._processingQueue(message._queueName), function(err, cnt){
          should.not.exist(err);
          cnt.should.eql(1);
          done();
        })
      });


      it('should requeue messages past a specified duration', function(done){
        notices.flushQueue(testQueue, function(err){
          should.not.exist(err);
          notices.queue(testQueue, payload, function(err, queueMessage){
            should.not.exist(err);
            notices.dequeue(testQueue, function(err, _message){
              should.not.exist(err);
              should.exist(_message);
              setTimeout(function(){
                // queue another message to ensure it only requeues one
                notices.queue(testQueue, payload, function(err, queueMessage){
                  notices.dequeue(testQueue, function(err, _message){
                    // trigger requeue
                    notices.requeueExpired(testQueue, 50, function(err){
                      // check length of queue
                      notices.length(testQueue, function(err, len){
                        should.not.exist(err);
                        len.should.eql(1);
                        notices.dequeue(testQueue, function(err, _message){
                          should.not.exist(err);
                          should.exist(_message);
                          done();
                        });
                      })
                    });
                  });
                });
              }, 100);
            });
          });
        });
      })
    });


    describe('Blocking queue', function(){
      var options = { block: true }
      it('should block until a message is queued');
    });


    describe('Non-blocking queue', function(){
     it('should not block until a message is queued', function(done){
        notices.dequeue(testQueue, function(err, p){
          should.not.exist(err);
          should.not.exist(p);
          done();
        });
      });
    });

  });


});
