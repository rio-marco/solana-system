const constants = require('../../../../lib/constants');
const messages = require('../../../../lib/messages');
const { verifySession } = require('../../../../lib/session');
const { errorResponse, successResponse, authErrorResponse, log1 } = require("../../../../lib/general");
const Deposit = require('../../../../lib/models/deposit.model');

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

        const totalCount = await Deposit.countDocuments({ userId: sessionAuth.userId });
        const totalPages = Math.ceil(totalCount / limit) || 0;

        const deposits = await Deposit.find({ userId: sessionAuth.userId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        return successResponse("Deposits fetched successfully.", {
            deposits,
            totalCount,
            totalPages,
            currentPage: page,
            limit,
        });
    } catch (err) {
        log1(['Error in deposit/list API route:', err.message]);
        return errorResponse(messages.unexpectedDataError);
    };
};

const dynamic = 'force-dynamic';

module.exports = { dynamic, GET };