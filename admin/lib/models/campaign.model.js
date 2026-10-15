'use strict';

const mongoose = require('mongoose');

const CampaignSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        rewards: { type: Number, required: true, min: 0, default: 0 },
        comments: { type: [String], default: [] },
    },
    { timestamps: true },
);

CampaignSchema.index({ createdAt: -1 });

module.exports = mongoose.models.Campaign || mongoose.model('Campaign', CampaignSchema);