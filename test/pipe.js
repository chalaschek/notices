var should      = require('should'),
    Pipe     = require('../lib/pipe');


describe('Pipe', function(){
  var pipe;

  before(function(){
    pipe = new Pipe();
  });

  describe('Pubsub', function(){
    it('should expose a publish method', function(){
      should.exist(pipe.publish);
    });

    it('should expose a subscribe method', function(){
      should.exist(pipe.subscribe);
    });

    it('should expose a unsubscribe method', function(){
      should.exist(pipe.unsubscribe);
    });
  });


  describe('Queue', function(){
    it('should expose a queue method', function(){
      should.exist(pipe.queue);
    });

    it('should expose a requeue method', function(){
      should.exist(pipe.requeue);
    });

    it('should expose a requeue expired method', function(){
      should.exist(pipe.requeueExpired);
    });

    it('should expose a dequeue method', function(){
      should.exist(pipe.dequeue);
    });

    it('should expose a ack method', function(){
      should.exist(pipe.ack);
    });

    it('should expose a length method', function(){
      should.exist(pipe.length);
    });

  });

});
