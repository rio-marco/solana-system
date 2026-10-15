'use strict';

const mongoose = require('mongoose');
const messages = require('../../../../../../lib/messages');
const { verifySession } = require('../../../../../../lib/session');
const { errorResponse, successResponse, authErrorResponse, log1 } = require('../../../../../../lib/general');
const Activitie = require('../../../../../../lib/models/activitie.model');
const Campaign = require('../../../../../../lib/models/campaign.model');

async function GET(req, { params }) {
    try {
        const sessionAuth = await verifySession(req);
        if (!sessionAuth || !sessionAuth.adminId) {
            return authErrorResponse(messages.unauthorizedAccess);
        };

        const userId = params?.id;
        if (!userId || !mongoose.isValidObjectId(userId)) {
            return errorResponse('Invalid user ID.');
        };

        const { searchParams } = new URL(req.url);
        const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
        const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10', 10)));

        const filter = { user_id: userId };

        const totalCount = await Activitie.countDocuments(filter);
        const totalPages = Math.ceil(totalCount / limit) || 0;

        const currentPage = totalPages > 0 ? Math.min(page, totalPages) : 1;
        const skip = (currentPage - 1) * limit;

        const activities = await Activitie.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('campaign_id', 'name')
            .lean();

        return successResponse('User activity fetched successfully.', {
            activities,
            pagination: {
                totalCount,
                totalPages,
                currentPage,
                limit,
            },
        });
    } catch (error) {
        log1(['Error in admin user activity GET:', error.message]);
        return errorResponse(messages.unexpectedDataError);
    };
};

const dynamic = 'force-dynamic';
module.exports = { dynamic, GET };