var should      = require('should'),
    events      = require('events'),
    notices     = require('../index').notices,
    RedisPipe   = require('../index').RedisPipe;

describe('Notices', function(){
  var pipe = new RedisPipe();

  it('should set the pipe', function(){
    notices.setPipe(pipe);
    should.exist(notices._pipe);
  })

  it('should disconnect the pipe', function(){
    notices.disconnect();
  })

  describe("Notify", function(){
    it('should notify an object', function(){
      should.exist(notices);
      should.exist(notices.notify);
      var obj = function(){}

      notices.notify(obj);
      should.exist(obj.publish);
      should.exist(obj.subscribe);

      should.exist(obj.queue);
      should.exist(obj.dequeue);
      should.exist(obj.ack);
      should.exist(obj.length);
      should.exist(obj.flushQueue);
    });
  });

});
