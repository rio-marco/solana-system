const constants = require('../../../../../lib/constants');
const messages = require('../../../../../lib/messages');
const { verifySession } = require('../../../../../lib/session');
const { generateNewPlatformAddress } = require('../../../../../lib/services/solana.service');
const { errorResponse, successResponse, authErrorResponse, log1 } = require("../../../../../lib/general");

async function POST(req) {
    try {
        const sessionAuth = await verifySession(req);
        if (!sessionAuth) {
            return authErrorResponse(messages.unauthorizedAccess);
        };

        const newPubKey = await generateNewPlatformAddress();

        return successResponse('Brand new platform deposit address generated successfully!',
            {
                exists: true,
                address: newPubKey.toBase58(),
                network: process.env.SOLANA_NETWORK || 'devnet',
            },
        );
    } catch (err) {
        log1(['Error in deposit/address/generate API route:', err.message]);
        return errorResponse(messages.unexpectedDataError);
    };
};

module.exports = { POST };