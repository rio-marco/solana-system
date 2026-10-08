'use strict';

const mongoose = require('mongoose');

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
    },
    {
        timestamps: true,
    },
);

module.exports = mongoose.models.Admin || mongoose.model('Admin', AdminSchema);