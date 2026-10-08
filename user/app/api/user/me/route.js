const { verifySession } = require('../../../../lib/session');
const constants = require('../../../../lib/constants');
const messages = require('../../../../lib/messages');
const { errorResponse, successResponse, authErrorResponse, log1 } = require("../../../../lib/general");

async function GET(req) {
    try {
        const sessionAuth = await verifySession(req);
        if (!sessionAuth || !sessionAuth.user) {
            return authErrorResponse(messages.unauthorizedAccess);
        }

        const { user } = sessionAuth;

        return successResponse("User fetched successfully",
            {
                user: {
                    _id: user._id,
                    email: user.email,
                    fullName: user.fullName,
                    profilePhoto: user.profilePhoto || "",
                    memo: user.memo,
                    walletBalance: user.walletBalance,
                    is2FAEnabled: user.twoFAStatus === constants.TwoFA_STATUS.ENABLED,
                },
                network: process.env.SOLANA_NETWORK || 'devnet',
                rpcUrl: process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com',
            },
        );
    } catch (error) {
        log1(['Error in user/me API route:', error.message]);
        return errorResponse(messages.unexpectedDataError);
    };
};

const dynamic = 'force-dynamic';

module.exports = { dynamic, GET };