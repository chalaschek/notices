var should            = require('should'),
    Pipe           = require('../lib/pipe'),
    RedisPipe      = require('../lib/redis-pipe');

describe('Redis Pipe', function(){
  var redisPipe;


  before(function(){
    redisPipe = new RedisPipe();
  });

  it('should subsclass Pipe', function(){
    (RedisPipe.super_ == Pipe).should.be.ok;
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

      redisPipe.subscribe('test:event', function(data){
        doneCheck();
      });

      redisPipe.subscribe('test:event', function(data){
        doneCheck();
      });

      redisPipe.subscribe(':error', function(data){
        err = new Error("Invalid message");
        done(err);
      });

      redisPipe.publish('test:event', {}, function(err){
        should.not.exist(err);
        doneCheck();
      });
    });
  });

  describe('Queue', function(){
    var payload;
    var testQueue = "_test_notices:test";
    var message;

    before(function(){
      payload = { time: Date.now() };
    });

    after(function(done){
      redisPipe.flushQueue(testQueue, function(){
        redisPipe.flushQueue(redisPipe._processingQueue(testQueue), function(){
          done()
        });
      });
    });

    it('should queue a payload', function(done){
      redisPipe.queue(testQueue, payload, function(err){
        should.not.exist(err);
        done()
      });
    });

    it('should return the length of the queue', function(done){
      redisPipe.length(testQueue, function(err, cnt){
        should.not.exist(err);
        should.exist(cnt);
        cnt.should.eql(1);
        done();
      })
    });


    it('should dequeue a payload', function(done){
      redisPipe.dequeue(testQueue, function(err, p){
        should.not.exist(err);
        should.exist(p);
        message = p;
        message.payload.time.should.eql(payload.time);
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
      redisPipe.ack(testQueue, message, function(err){
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
      redisPipe.queue(testQueue, payload, function(err){
        should.not.exist(err);

        redisPipe.dequeue(testQueue, {auto_ack: true}, function(err, _p){
          should.not.exist(err)
          should.exist(_p);

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
      redisPipe.queue(testQueue, payload, function(err){
        should.not.exist(err);
        redisPipe.queue(testQueue, payload, function(err){
          should.not.exist(err);

          redisPipe.dequeue(testQueue, {auto_ack: true, count: 2}, function(err, _p){
            should.not.exist(err)
            should.exist(_p);
            (_p instanceof Array).should.be.ok;
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
        redisPipe.dequeue(testQueue, function(err, p){
          should.not.exist(err);
          should.not.exist(p);
          done();
        });
      });
    });

  });
});
