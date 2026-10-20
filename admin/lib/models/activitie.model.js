'use strict';

const mongoose = require('mongoose');
const constants = require('../constants');

const ActivitySchema = new mongoose.Schema(
    {
        user_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "user_id is required"],
            index: true,
        },
        campaign_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Campaign",
            required: [true, "campaign_id is required"],
            index: true,
        },
        comment_url: {
            type: String,
            required: [true, "comment_url is required"],
            trim: true,
        },
        status: {
            type: Number,
            enum: Object.values(constants.ACTIVITY_STATUS),
            default: constants.ACTIVITY_STATUS.PENDING,
        },
        rewarded: {
            type: Boolean,
            default: false,
            index: true,
        },
        rewardUnlocked: {
            type: Number,
            enum: Object.values(constants.REWARD_UNLOCKED_STATUS),
            default: constants.REWARD_UNLOCKED_STATUS.PENDING,
        },
    },
    {
        timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
        strict: false,
    },
);

ActivitySchema.index({ user_id: 1, campaign_id: 1 }, { unique: true });

module.exports = mongoose.models.Activitie || mongoose.model('Activitie', ActivitySchema);