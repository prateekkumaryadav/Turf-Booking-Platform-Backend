const { createClient } = require('redis');

// Create Redis Client
const redisClient = createClient({
  url: process.env.REDIS_URI || 'redis://redis:6379'
});

redisClient.on('error', (err) => console.log('Redis Client Error', err));
redisClient.on('connect', () => console.log('Redis connected successfully'));

const connectRedis = async () => {
    try {
        await redisClient.connect();
    } catch(err) {
        console.error('Initial Redis connection failed', err);
    }
}

connectRedis();

module.exports = redisClient;
