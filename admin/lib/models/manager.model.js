'use strict';

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const constants = require('../constants');

const ManagerSchema = new mongoose.Schema(
    {
        name: {
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
            index: true
        },
        password: {
            type: String,
            required: true,
        },
        phoneNumber: {
            type: String,
            default: '',
            trim: true,
        },
        profilePhoto: {
            type: String,
            default: '',
            trim: true,
        },
        status: {
            type: Number,
            enum: Object.values(constants.MANAGER_STATUS),
            default: constants.MANAGER_STATUS.INACTIVE,
        },
    },
    { timestamps: true },
);

ManagerSchema.methods.comparePassword = async function (candidatePassword) {
    if (!this.password || !candidatePassword) return false;
    return await bcrypt.compare(candidatePassword, this.password);
};

ManagerSchema.statics.hashPassword = async function (plainPassword) {
    const salt = await bcrypt.genSalt(constants.BCRYPT_SALT);
    return await bcrypt.hash(plainPassword, salt);
};

module.exports = mongoose.models.Manager || mongoose.model('Manager', ManagerSchema);