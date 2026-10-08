const messages = require('../../../lib/messages');
const { verifySession } = require('../../../lib/session');
const Notification = require('../../../lib/models/notification.model');
const { errorResponse, successResponse, authErrorResponse, log1 } = require("../../../lib/general");

async function GET(req) {
    try {
        const sessionAuth = await verifySession(req);
        if (!sessionAuth || !sessionAuth.userId) {
            return authErrorResponse(messages.unauthorizedAccess);
        };

        const notifications = await Notification.find({ userId: sessionAuth.userId })
            .sort({ createdAt: -1 })
            .limit(30)
            .lean();

        return successResponse("Notifications fetched successfully.", { notifications });
    } catch (err) {
        log1(['Error in notifications API route:', err.message]);
        return errorResponse(messages.unexpectedDataError);
    };
};

const dynamic = 'force-dynamic';

module.exports = { dynamic, GET };