'use strict';

const mongoose = require('mongoose');
const constants = require('../constants');

const NotificationSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
        },
        message: {
            type: String,
            required: true,
            trim: true,
        },
        type: {
            type: Number,
            enum: Object.values(constants.NOTIFICATION_TYPE),
            default: constants.NOTIFICATION_TYPE.SYSTEM,
        },
        amount: {
            type: Number,
            default: 0,
        },
        transactionSignature: {
            type: String,
            default: null,
        },
        isRead: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    },
);

NotificationSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);