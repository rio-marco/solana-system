'use strict';

const mongoose = require('mongoose');
const constants = require('../constants');

const sessionSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: false,
        },
        authToken: {
            type: String,
            required: true,
        },
        ip: {
            type: String,
            default: '127.0.0.1',
        },
        ua: {
            type: String,
            default: 'Web-Browser',
        },
        status: {
            type: Number,
            enum: Object.values(constants.SESSION_STATUS),
            default: constants.SESSION_STATUS.ACTIVE,
        },
    },
    {
        versionKey: false,
        timestamps: true,
    },
);

module.exports = mongoose.model('Sessions', sessionSchema);