var should      = require('should'),
    notices     = require('../index');

describe("Notices.notify", function(){
  before(function(done){
    done()
  });

  it("it should notify an object", function(){
    should.exist(notices);
    should.exist(notices.notify);

    var obj = function(){}

    notices.notify(obj);
    should.exist(obj.publish);
    should.exist(obj.subscribe);
  });

});
