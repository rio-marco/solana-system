const twoFactor = require('node-2fa');
const constants = require('../../../../../lib/constants');
const messages = require('../../../../../lib/messages');
const { verifySession } = require('../../../../../lib/session');
const { errorResponse, successResponse, authErrorResponse, log1 } = require("../../../../../lib/general");

async function POST(req) {
    try {
        const sessionAuth = await verifySession(req);
        if (!sessionAuth || !sessionAuth.user) {
            return authErrorResponse(messages.unauthorizedAccess);
        };

        const { user } = sessionAuth;
        const newSecret = twoFactor.generateSecret({
            name: constants.PLATFORM_NAME || 'solana-system',
            account: user.email,
        });

        return successResponse("2FA secret generated successfully.", {
            secret: newSecret.secret,
            uri: newSecret.uri,
            qr: newSecret.qr,
        });
    } catch (error) {
        log1(['Error in 2fa/generate API route:', error.message]);
        return errorResponse(messages.unexpectedDataError);
    };
};

module.exports = { POST };