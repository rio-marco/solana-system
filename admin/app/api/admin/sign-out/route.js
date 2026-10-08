const constants = require('../../../../lib/constants');
const Session = require('../../../../lib/models/session.model');
const { verifySession } = require('../../../../lib/session');
const { errorResponse, successResponse, log1 } = require("../../../../lib/general");

async function POST(req) {
    try {
        const sessionAuth = await verifySession(req);
        if (sessionAuth && sessionAuth.adminId && sessionAuth.authToken) {
            await Session.updateOne(
                { userId: sessionAuth.adminId, authToken: sessionAuth.authToken },
                { status: constants.SESSION_STATUS.EXPIRED }
            );
        };

        const response = successResponse("Sign out successfully.");

        response.cookies.delete('authToken');
        response.cookies.delete(constants.PLATFORM_NAME);

        return response;
    } catch (error) {
        log1(['Error in sign-out API route:', error.message]);
        return errorResponse(messages.unexpectedDataError);
    };
};

module.exports = { POST };