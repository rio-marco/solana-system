const constants = require('../../../../lib/constants');
const messages = require('../../../../lib/messages');
const { verifySession } = require('../../../../lib/session');
const { errorResponse, successResponse, authErrorResponse, log1 } = require("../../../../lib/general");
const Withdrawal = require('../../../../lib/models/withdrawal.model');

async function GET(req) {
    try {
        const sessionAuth = await verifySession(req);
        if (!sessionAuth || !sessionAuth.userId) {
            return authErrorResponse(messages.unauthorizedAccess);
        };

        const withdrawals = await Withdrawal.find({ userId: sessionAuth.userId })
            .sort({ createdAt: -1 })
            .limit(50)
            .lean();

        return successResponse("Withdrawals fetched successfully.", { withdrawals });
    } catch (err) {
        log1(['Error in withdraw/list API route:', err.message]);
        return errorResponse(messages.unexpectedDataError);
    };
};

const dynamic = 'force-dynamic';

module.exports = { dynamic, GET };