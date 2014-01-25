var should      = require('should'),
    events      = require('events'),
    notices     = require('../index');

describe('Notices.notify', function(){

  it('should notify an object', function(){
    should.exist(notices);
    should.exist(notices.notify);
    var obj = function(){}
    notices.notify(obj);
    should.exist(obj.publish);
    should.exist(obj.subscribe);
  });

});
