const redis = require('redis');
const bluebird = require('bluebird');
const config = require('./config');

bluebird.promisifyAll(redis.RedisClient.prototype);

const redisClient = redis.createClient(config.redisPort, config.redisUrl);
if (config.redisAuth) {
  redisClient.auth(config.redisAuth, (err) => {
    if (err) { throw err; }
  });
}

module.exports = redisClient;
