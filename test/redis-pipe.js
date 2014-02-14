var should            = require('should'),
    Pipe           = require('../lib/pipe'),
    notices        = require('../index').notices,
    RedisPipe      = require('../index').RedisPipe;

describe('Redis Pipe', function(){
  var redisPipe;

  before(function(){
    redisPipe = new RedisPipe();
    notices.setPipe(redisPipe);
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

      notices.subscribe('test:event', function(data){
        doneCheck();
      });

      notices.subscribe('test:event', function(data){
        doneCheck();
      });

      notices.subscribe(':error', function(data){
        err = new Error("Invalid message");
        done(err);
      });

      notices.publish('test:event', {}, function(err){
        should.not.exist(err);
        doneCheck();
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
      redisPipe._pub.llen(redisPipe._processingQueue(testQueue), function(err, cnt){
        should.not.exist(err);
        should.exist(cnt);
        cnt.should.eql(1);
        done();
      })
    });

    it('should ack the processing queue', function(done){
      notices.ack(queueMessage, function(err){
        should.not.exist(err);
        redisPipe._pub.llen(redisPipe._processingQueue(testQueue), function(err, cnt){
          should.not.exist(err);
          should.exist(cnt);
          cnt.should.eql(0);
          done();
        })
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
