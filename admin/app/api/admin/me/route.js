const { verifySession } = require('../../../../lib/session');
const constants = require('../../../../lib/constants');
const messages = require('../../../../lib/messages');
const { errorResponse, successResponse, authErrorResponse, log1 } = require("../../../../lib/general");

async function GET(req) {
    try {
        const sessionAuth = await verifySession(req);
        if (!sessionAuth || !sessionAuth.admin) {
            return authErrorResponse(messages.unauthorizedAccess);
        }

        const { admin } = sessionAuth;

        return successResponse("Admin details fetched successfully",
            {
                admin: {
                    _id: admin._id,
                    email: admin.email,
                    name: admin.name,
                },
                network: process.env.SOLANA_NETWORK || 'devnet',
                rpcUrl: process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com',
            },
        );
    } catch (error) {
        log1(['Error in admin/me API route:', error.message]);
        return errorResponse(messages.unexpectedDataError);
    };
};

const dynamic = 'force-dynamic';

module.exports = { dynamic, GET };