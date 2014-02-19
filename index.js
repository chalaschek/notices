var Notices     = require('./lib/notices'),
    RedisPipe   = require('./lib/redis-pipe');

module.exports = initNotices;

function initNotices(options){
  var _notices = new Notices(options);
  return _notices;
}

// expose RedisPipe
module.exports.RedisPipe = RedisPipe;

// expose Notices
module.exports.Notices = Notices;