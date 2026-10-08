const mongoose = require('mongoose');
const { log1, } = require('./general');

let cachedConnection = null;

const connectDB = async () => {
    if (cachedConnection && mongoose.connection.readyState === 1) {
        return cachedConnection;
    };

    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            autoIndex: true,
        });

        cachedConnection = conn;
        log1(["Database connected successfully."]);
        return conn;
    } catch (error) {
        log1(["Error connecting to database ----->", error.message]);
        throw error;
    };
};

module.exports = connectDB;