const constants = require('../../../../lib/constants');
const messages = require('../../../../lib/messages');
const { verifySession } = require('../../../../lib/session');
const { getPlatformReceivingAddress } = require('../../../../lib/services/solana.service');
const { MEMO_PROGRAM_ID } = require('../../../../lib/solana');
const { errorResponse, successResponse, authErrorResponse, log1 } = require("../../../../lib/general");

async function GET(req) {
    try {
        const sessionAuth = await verifySession(req);
        if (!sessionAuth || !sessionAuth.user) {
            return authErrorResponse(messages.unauthorizedAccess);
        };

        const { user } = sessionAuth;

        if (!user.memo || !/^\d{8}$/.test(String(user.memo))) {
            return errorResponse("Your account is missing a valid deposit memo. Please contact support.");
        };

        const platformPubKey = await getPlatformReceivingAddress(true);
        if (!platformPubKey) {
            return errorResponse("Platform deposit address is not configured yet. Please try again later.");
        };

        return successResponse("Deposit configuration fetched successfully.", {
            platformAddress: platformPubKey.toBase58(),
            memo: String(user.memo),
            network: process.env.SOLANA_NETWORK || 'devnet',
            commitment: process.env.SOLANA_COMMITMENT || 'confirmed',
            rpcUrl: process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com',
            memoProgramId: MEMO_PROGRAM_ID.toBase58(),
            maxDepositSol: constants.MAX_DEPOSIT_SOL,
        });
    } catch (err) {
        log1(['Error in deposit/config API route:', err.message]);
        return errorResponse(messages.unexpectedDataError);
    };
};

const dynamic = 'force-dynamic';

module.exports = { dynamic, GET };