var should      = require('should'),
    notices     = require('../index')(),
    mongoose    = require('mongoose');

describe('Mongoose', function(){
  var schema;

  before(function(){
    schema = new mongoose.Schema({});
    notices.notify(schema);
  });

  it('should notify statics', function(){
    should.exist(schema.statics.notifyPublish);
    should.exist(schema.statics.notifySubscribe);
  });

  it('should notify methods', function(){
    should.exist(schema.methods.notifyPublish);
    should.exist(schema.methods.notifySubscribe);
  });

});
