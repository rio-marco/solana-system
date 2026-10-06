const messages = require('../../../../lib/messages');
const { verifySession } = require('../../../../lib/session');
const Notification = require('../../../../lib/models/notification.model');
const { errorResponse, successResponse, authErrorResponse, log1 } = require("../../../../lib/general");

async function POST(req) {
    try {
        const sessionAuth = await verifySession(req);
        if (!sessionAuth || !sessionAuth.userId) {
            return authErrorResponse(messages.unauthorizedAccess);
        };

        await Notification.updateMany(
            { userId: sessionAuth.userId, isRead: false },
            { isRead: true }
        );

        return successResponse("All notifications marked as read.");
    } catch (err) {
        log1(['Error in notifications/read-all API route:', err.message]);
        return errorResponse(messages.unexpectedDataError);
    };
};

module.exports = { POST };