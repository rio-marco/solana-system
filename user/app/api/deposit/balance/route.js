const constants = require('../../../../lib/constants');
const messages = require('../../../../lib/messages');
const { verifySession } = require('../../../../lib/session');
const { getPlatformReceivingAddress, getOnChainBalance } = require('../../../../lib/services/solana.service');
const { errorResponse, successResponse, authErrorResponse, log1 } = require("../../../../lib/general");

async function GET(req) {
    try {
        const sessionAuth = await verifySession(req);
        if (!sessionAuth) {
            return authErrorResponse(messages.unauthorizedAccess);
        };

        const platformPubKey = await getPlatformReceivingAddress(true);
        const balanceData = await getOnChainBalance(platformPubKey);

        return successResponse('get balance successfully!',
            {
                address: platformPubKey.toBase58(),
                balance: balanceData.balance,
                lamports: balanceData.lamports,
                currency: balanceData.currency,
            },
        );
    } catch (err) {
        log1(['Error in deposit/balance API route:', err.message]);
        return errorResponse(messages.unexpectedDataError);
    };
};

const dynamic = 'force-dynamic';

module.exports = { dynamic, GET };