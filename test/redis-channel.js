var should            = require('should'),
    Pipe           = require('../lib/pipe'),
    RedisPipe      = require('../lib/redis-pipe');

describe('Redis Pipe', function(){
  var redisPipe;

  before(function(){
    redisPipe = new RedisPipe();
  });

  it('should expose a publish method', function(){
    should.exist(redisPipe.publish);
  });

  it('should expose a subscribe method', function(){
    should.exist(redisPipe.subscribe);
  });

  it('should subclass Pipe', function(){
    (RedisPipe.super_.prototype == Pipe.prototype).should.be.ok
  });

  it('subsribers should receive published messages', function(done){
    var _count = 0;
    var err;
    redisPipe.subscribe('test:event', function(data){
      _count++;
      if(_count == 2 && !err)
        done();
    });

    redisPipe.subscribe('test:event', function(data){
      _count++;
      if(_count == 2 && !err)
        done();
    });

    redisPipe.subscribe(':error', function(data){
      err = new Error("Invalid message");
      done(err);
    });

    redisPipe.publish('test:event', {});
  });

});
