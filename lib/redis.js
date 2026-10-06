const redis = require('redis');
const { log1, } = require('./general');

const redisClient = redis.createClient({
    username: process.env.REDIS_USERNAME || 'default',
    password: process.env.REDIS_PASSWORD || '',
    socket: {
        host: process.env.REDIS_HOST || '127.0.0.1',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
    },
});

redisClient.on('error', (err) => log1(['Redis Client Connection Error:', err.message]));
redisClient.on('connect', () => log1(['Redis Client Connected.']));

if (!redisClient.isOpen) {
    redisClient.connect().catch((err) => log1(['Redis connect error:', err.message]));
};

module.exports = redisClient;