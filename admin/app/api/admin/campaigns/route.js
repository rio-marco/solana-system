'use strict';

const messages = require('../../../../lib/messages');
const { verifySession } = require('../../../../lib/session');
const { errorResponse, successResponse, authErrorResponse, log1 } = require('../../../../lib/general');
const { parseCampaignInput } = require('../../../../lib/campaign-input');
const Campaign = require('../../../../lib/models/campaign.model');

function escapeRegex(text) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

async function GET(req) {
    try {
        const sessionAuth = await verifySession(req);
        if (!sessionAuth || !sessionAuth.adminId) {
            return authErrorResponse(messages.unauthorizedAccess);
        };

        const { searchParams } = new URL(req.url);
        const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
        const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10', 10)));
        const skip = (page - 1) * limit;
        const search = (searchParams.get('search') || '').trim();

        const query = {};

        if (search) {
            query.name = { $regex: escapeRegex(search), $options: 'i' };
        };

        const [campaigns, totalCount] = await Promise.all([
            Campaign.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
            Campaign.countDocuments(query),
        ]);

        const totalPages = Math.ceil(totalCount / limit);

        return successResponse('Campaigns fetched successfully.', {
            campaigns,
            totalCount,
            totalPages,
            currentPage: page,
            limit,
        });
    } catch (error) {
        log1(['Error in admin campaigns GET:', error.message]);
        return errorResponse(messages.unexpectedDataError);
    };
};

async function POST(req) {
    try {
        const sessionAuth = await verifySession(req);
        if (!sessionAuth || !sessionAuth.adminId) {
            return authErrorResponse(messages.unauthorizedAccess);
        };

        const body = await req.json();
        const { error, data } = parseCampaignInput(body);

        if (error) {
            return errorResponse(error);
        };

        const campaign = await Campaign.create(data);

        return successResponse('Campaign created successfully.', { campaign });
    } catch (error) {
        log1(['Error in admin campaigns POST:', error.message]);
        return errorResponse(messages.unexpectedDataError);
    };
};

const dynamic = 'force-dynamic';
module.exports = { dynamic, GET, POST };
