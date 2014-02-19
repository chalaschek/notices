var should      = require('should'),
    events      = require('events'),
    notices     = require('../index')(),
    RedisPipe   = require('../lib/redis-pipe');

describe('Notices', function(){

  var pipe = new RedisPipe();

  it('should default to a redis pipe', function(){
    should.exist(notices._pipe);
  });

  it('should set the pipe', function(){
    notices.setPipe(pipe);
    should.exist(notices._pipe);
  })

  it('should disconnect the pipe', function(){
    notices.disconnect();
  })

  describe("Namespaces", function(){
    var _notices;

    before(function(){
      _notices = require('../index')({namespace: "test"});
    });

    it('should support channel namespaces', function(){
      var q = _notices._queue("queue");
      q.should.eql("notices.queue.test.queue");
      var c = _notices._channel("queue");
      c.should.eql("notices.channel.test.queue");
    });


    it('should support use namespace when queueing', function(){
      _notices.queue("queue", {data: "here"}, function(err, message){
        should.not.exist(err);
        should.exist(message);
        message._queueName.should.eql("notices.queue.test.queue");
      })
    });
  });

  describe("Notify", function(){
    it('should notify an object', function(){
      should.exist(notices);
      should.exist(notices.notify);
      var obj = function(){}

      notices.notify(obj);
      should.exist(obj.publish);
      should.exist(obj.subscribe);

      should.exist(obj.queue);
      should.exist(obj.requeue);
      should.exist(obj.requeueExpired);
      should.exist(obj.dequeue);
      should.exist(obj.ack);
      should.exist(obj.length);
      should.exist(obj.flushQueue);
    });
  });

});
