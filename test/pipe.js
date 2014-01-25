var should      = require('should'),
    Pipe     = require('../lib/pipe');


describe('Pipe', function(){
  var pipe;

  before(function(){
    pipe = new Pipe();
  });

  it('should expose a publish method', function(){
    should.exist(pipe.publish);
  });

  it('should expose a subscribe method', function(){
    should.exist(pipe.subscribe);
  });

});
