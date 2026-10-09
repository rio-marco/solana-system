'use strict';

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const AdminSchema = new mongoose.Schema(
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
            index: true,
        },
        password: {
            type: String,
            required: true,
        },
    },
    {
        timestamps: true,
    },
);

AdminSchema.methods.comparePassword = async function (candidatePassword) {
    if (!this.password || !candidatePassword) return false;
    return await bcrypt.compare(candidatePassword, this.password);
};

AdminSchema.statics.hashPassword = async function (plainPassword) {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(plainPassword, salt);
};

module.exports = mongoose.models.Admin || mongoose.model('Admin', AdminSchema);