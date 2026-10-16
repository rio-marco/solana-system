'use strict';

const messages = require('../../../../lib/messages');
const { verifySession } = require('../../../../lib/session');
const { errorResponse, successResponse, authErrorResponse, log1 } = require('../../../../lib/general');
const Campaign = require('../../../../lib/models/campaign.model');

async function GET(req) {
    try {
        const sessionAuth = await verifySession(req);
        if (!sessionAuth || !sessionAuth.userId) {
            return authErrorResponse(messages.unauthorizedAccess);
        };

        const { searchParams } = new URL(req.url);
        const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
        const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '10', 10)));
        const skip = (page - 1) * limit;

        const totalCount = await Campaign.countDocuments({});
        const totalPages = Math.ceil(totalCount / limit) || 0;

        const campaigns = await Campaign.find({})
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        return successResponse('Campaigns fetched successfully.', {
            campaigns,
            totalCount,
            totalPages,
            currentPage: page,
            limit,
        });
    } catch (error) {
        log1(['Error in campaign/list API route:', error.message]);
        return errorResponse(messages.unexpectedDataError);
    };
};

const dynamic = 'force-dynamic';
module.exports = { dynamic, GET };
