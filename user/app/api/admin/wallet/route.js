const messages = require('../../../../lib/messages');
const { verifySession } = require('../../../../lib/session');
const { errorResponse, successResponse, authErrorResponse, log1 } = require("../../../../lib/general");
const { getPlatformReceivingAddress, getOnChainBalance } = require('../../../../lib/services/solana.service');
const Wallet = require('../../../../lib/models/wallet.model');

async function GET(req) {
    try {
        const sessionAuth = await verifySession(req);
        if (!sessionAuth || !sessionAuth.userId) {
            return authErrorResponse(messages.unauthorizedAccess);
        };

        const pubKey = await getPlatformReceivingAddress(true);
        if (!pubKey) {
            return errorResponse("Platform deposit wallet is not initialized.");
        };

        const addressStr = pubKey.toBase58();
        let balanceInfo = { balance: 0, lamports: 0, currency: 'SOL' };

        try {
            balanceInfo = await getOnChainBalance(addressStr);
        } catch (e) {
            log1(["Warning: Could not fetch balance for platform wallet:", e.message]);
        };

        const walletRecord = await Wallet.findOne({ publicKey: addressStr }).lean();

        return successResponse("Admin wallet retrieved successfully.", {
            address: addressStr,
            balance: balanceInfo.balance,
            lamports: balanceInfo.lamports,
            currency: balanceInfo.currency,
            network: walletRecord ? walletRecord.network : (process.env.SOLANA_NETWORK || 'devnet'),
            createdAt: walletRecord ? walletRecord.createdAt : null,
            isActive: walletRecord ? walletRecord.isActive : true,
        });
    } catch (err) {
        log1(['Error in admin/wallet API route:', err.message]);
        return errorResponse(err.message || messages.unexpectedDataError);
    };
};

const dynamic = 'force-dynamic';

module.exports = { dynamic, GET };
