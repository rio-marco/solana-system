'use strict';

const mongoose = require('mongoose');
const constants = require('../constants');

const OTPSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            default: "",
        },
        otp: {
            type: String,
            default: "",
        },
        verificationToken: {
            type: String,
            default: "",
        },
        verificationOtpExpires: {
            type: Date,
            default: null,
        },
        directUrlExpires: {
            type: Date,
            default: null,
        },
        type: {
            type: Number,
            enum: Object.values(constants.OTP_TYPE),
            default: constants.OTP_TYPE.SIGNUP,
        },
    },
    {
        versionKey: false,
        timestamps: true,
    },
);

module.exports = mongoose.model('OTP', OTPSchema);