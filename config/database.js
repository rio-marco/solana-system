const mongoose = require('mongoose');
const generalLib = require('../utils/lib/general.lib');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        generalLib.log1(["Database connected successfully."]);
    } catch (error) {
        generalLib.log1(["Error in connectDB ----->", error.message]);
        throw error;
    };
};

module.exports = connectDB;