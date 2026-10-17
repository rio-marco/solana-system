'use strict';

const mongoose = require('mongoose');
const constants = require('../../../../lib/constants');
const messages = require('../../../../lib/messages');
const { verifySession } = require('../../../../lib/session');
const { errorResponse, successResponse, authErrorResponse, log1 } = require('../../../../lib/general');
const Campaign = require('../../../../lib/models/campaign.model');
const Activitie = require('../../../../lib/models/activitie.model');

const isValidUrl = (value) => {
    try {
        const url = new URL(String(value).trim());
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (e) {
        return false;
    };
};

async function POST(req) {
    try {
        const sessionAuth = await verifySession(req);
        if (!sessionAuth || !sessionAuth.userId) {
            return authErrorResponse(messages.unauthorizedAccess);
        };

        const userId = sessionAuth.userId;
        const body = await req.json();
        const { campaignId, commentUrl } = body || {};

        if (!campaignId || !mongoose.isValidObjectId(campaignId)) {
            return errorResponse('Invalid or missing campaign.');
        };

        const trimmedUrl = (commentUrl === undefined || commentUrl === null ? '' : String(commentUrl)).trim();

        if (!trimmedUrl) {
            return errorResponse('Commit URL is required.');
        };

        if (!isValidUrl(trimmedUrl)) {
            return errorResponse('Please enter a valid commit URL (starting with http:// or https://).');
        };

        if (trimmedUrl.length > 500) {
            return errorResponse('Commit URL is too long.');
        };

        const campaign = await Campaign.findById(campaignId).lean();
        if (!campaign) {
            return errorResponse('Campaign not found.');
        };

        const alreadyUsed = await Activitie.exists({ user_id: userId, campaign_id: campaignId });
        if (alreadyUsed) {
            return errorResponse('You have already used this campaign.');
        };

        const activity = await Activitie.create({
            user_id: userId,
            campaign_id: campaignId,
            comment_url: trimmedUrl,
            status: constants.ACTIVITY_STATUS.PENDING,
            rewarded: false,
        });

        return successResponse(
            'Campaign submitted successfully. Your submission is pending verification.',
            {
                activityId: activity._id,
                status: activity.status,
            },
        );
    } catch (error) {
        if (error && error.code === 11000) {
            return errorResponse('You have already used this campaign.');
        };

        log1(['Error in campaign/use API route:', error.message]);
        return errorResponse(messages.unexpectedDataError);
    };
};

module.exports = { POST };