const redis = require('redis');
const bluebird = require('bluebird');
const config = require('./config');

bluebird.promisifyAll(redis.RedisClient.prototype);

redisClient = redis.createClient(config.redisPort, config.redisUrl);
if (config.redisAuth){
  this.redisCli.auth(config.redisAuth, function (err) {
    if (err) { throw err; }
  });
}

module.exports = exports = redisClient;
