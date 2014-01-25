var should      = require('should'),
    notices     = require('../index'),
    mongoose    = require('mongoose');

describe('Mongoose', function(){
  var schema;

  before(function(){
    schema = new mongoose.Schema({});
    notices.notify(schema);
  });

  it('should notify statics', function(){
    should.exist(schema.statics.publish);
    should.exist(schema.statics.subscribe);
  });

  it('should notify methods', function(){
    should.exist(schema.methods.publish);
    should.exist(schema.methods.subscribe);
  });

});
