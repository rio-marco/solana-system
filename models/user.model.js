'use strict';

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const constants = require('../config/constant');

const UserSchema = new mongoose.Schema(
    {
        fullName: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true,
        },
        memo: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            index: true,
            match: /^\d{8}$/,
        },
        walletBalance: {
            type: Number,
            default: 0,
            min: 0,
        },
        status: {
            type: Number,
            enum: Object.values(constants.USER_STATUS),
            default: constants.USER_STATUS.INACTIVE,
        },
    },
    {
        timestamps: true,
    },
);

module.exports = mongoose.model('User', UserSchema);