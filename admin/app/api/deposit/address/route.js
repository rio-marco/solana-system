const constants = require('../../../../lib/constants');
const messages = require('../../../../lib/messages');
const { verifySession } = require('../../../../lib/session');
const { hasPlatformAddress, generateNewPlatformAddress, getPlatformReceivingAddress } = require('../../../../lib/services/solana.service');
const { errorResponse, successResponse, authErrorResponse, log1 } = require("../../../../lib/general");

async function GET(req) {
    try {
        const sessionAuth = await verifySession(req);
        if (!sessionAuth) {
            return authErrorResponse(messages.unauthorizedAccess);
        };

        const { searchParams } = new URL(req.url);
        const shouldForceGenerate = searchParams.get('generate') === 'true' || searchParams.get('force') === 'true';

        if (shouldForceGenerate) {
            const newPubKey = await generateNewPlatformAddress();
            return successResponse('New platform receiving address generated successfully!',
                {
                    exists: true,
                    address: newPubKey.toBase58(),
                    network: process.env.SOLANA_NETWORK || 'devnet',
                },
            );
        };

        const isSet = await hasPlatformAddress();
        if (isSet) {
            const platformPubKey = await getPlatformReceivingAddress(true);
            return successResponse('successfully!',
                {
                    exists: true,
                    address: platformPubKey.toBase58(),
                    network: process.env.SOLANA_NETWORK || 'devnet',
                },
            );
        };

        return successResponse('Platform receiving address is not generated yet.',
            {
                exists: false,
                address: null,
                network: process.env.SOLANA_NETWORK || 'devnet',
            },
        );
    } catch (err) {
        log1(['Error in deposit/address API route:', err.message]);
        return errorResponse(messages.unexpectedDataError);
    };
};

const dynamic = 'force-dynamic';

module.exports = { dynamic, GET };