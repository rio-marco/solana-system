'use strict';

const mongoose = require('mongoose');
const messages = require('../../../../../lib/messages');
const { verifySession } = require('../../../../../lib/session');
const { errorResponse, successResponse, authErrorResponse, log1 } = require('../../../../../lib/general');
const { parseCampaignInput } = require('../../../../../lib/campaign-input');
const Campaign = require('../../../../../lib/models/campaign.model');

async function GET(req, { params }) {
    try {
        const sessionAuth = await verifySession(req);
        if (!sessionAuth || !sessionAuth.adminId) {
            return authErrorResponse(messages.unauthorizedAccess);
        };

        const campaignId = params?.id;

        if (!campaignId || !mongoose.isValidObjectId(campaignId)) {
            return errorResponse('Invalid campaign ID.');
        };

        const campaign = await Campaign.findById(campaignId).lean();

        if (!campaign) {
            return errorResponse('Campaign not found.');
        };

        return successResponse('Campaign fetched successfully.', { campaign });
    } catch (error) {
        log1(['Error in admin campaign details GET:', error.message]);
        return errorResponse(messages.unexpectedDataError);
    };
};

async function PATCH(req, { params }) {
    try {
        const sessionAuth = await verifySession(req);
        if (!sessionAuth || !sessionAuth.adminId) {
            return authErrorResponse(messages.unauthorizedAccess);
        };

        const campaignId = params?.id;

        if (!campaignId || !mongoose.isValidObjectId(campaignId)) {
            return errorResponse('Invalid campaign ID.');
        };

        const campaign = await Campaign.findById(campaignId);
        if (!campaign) {
            return errorResponse('Campaign not found.');
        };

        const body = await req.json();
        const { error, data } = parseCampaignInput(body, { partial: true });

        if (error) {
            return errorResponse(error);
        };

        if (!data || Object.keys(data).length === 0) {
            return errorResponse('No changes provided.');
        };

        const updatedCampaign = await Campaign.findByIdAndUpdate(campaignId, data, { new: true }).lean();

        return successResponse('Campaign updated successfully.', { campaign: updatedCampaign });
    } catch (error) {
        log1(['Error in admin campaign details PATCH:', error.message]);
        return errorResponse(messages.unexpectedDataError);
    };
};

async function DELETE(req, { params }) {
    try {
        const sessionAuth = await verifySession(req);
        if (!sessionAuth || !sessionAuth.adminId) {
            return authErrorResponse(messages.unauthorizedAccess);
        };

        const campaignId = params?.id;

        if (!campaignId || !mongoose.isValidObjectId(campaignId)) {
            return errorResponse('Invalid campaign ID.');
        };

        const campaign = await Campaign.findByIdAndDelete(campaignId);

        if (!campaign) {
            return errorResponse('Campaign not found.');
        };

        return successResponse('Campaign deleted successfully.', { campaign });
    } catch (error) {
        log1(['Error in admin campaign details DELETE:', error.message]);
        return errorResponse(messages.unexpectedDataError);
    };
};

const dynamic = 'force-dynamic';
module.exports = { dynamic, GET, PATCH, DELETE };
