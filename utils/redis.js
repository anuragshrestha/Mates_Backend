const Redis = require('ioredis');

const redisClient = new Redis({
  host:  process.env.REDIS_HOST || 'mates-redis',
  port: 6379
});

redisClient.on('error', (err) => {
  console.error('[Redis Error]', err);
});




module.exports = redisClient;