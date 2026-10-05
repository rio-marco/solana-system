require("dotenv").config();

const redis = require("redis");
const generalLib = require("../utils/lib/general.lib");

const redisClient = redis.createClient({
    socket: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT,
    },
    password: process.env.REDIS_PASSWORD,
});

(async () => {
    if (!redisClient.isOpen) {
        await redisClient.connect();
    };
})();

redisClient.on("connect", () => generalLib.log1(["Redis Client Connected."]));
redisClient.on("error", (error) => generalLib.log1(["Redis Client Connection Error ----->", error]));

module.exports = redisClient;