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
  });


  describe('Queue', function(){
    it('should expose a queue method', function(){
      should.exist(pipe.queue);
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