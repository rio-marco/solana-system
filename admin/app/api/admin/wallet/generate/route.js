const messages = require('../../../../../lib/messages');
const { verifySession } = require('../../../../../lib/session');
const { errorResponse, successResponse, authErrorResponse, log1 } = require("../../../../../lib/general");
const { generateNewPlatformAddress, getOnChainBalance } = require('../../../../../lib/services/solana.service');
const Wallet = require('../../../../../lib/models/wallet.model');

async function POST(req) {
    try {
        const sessionAuth = await verifySession(req);
        if (!sessionAuth || !sessionAuth.adminId) {
            return authErrorResponse(messages.unauthorizedAccess);
        };

        const newPublicKey = await generateNewPlatformAddress();
        const addressStr = newPublicKey.toBase58();

        let balanceInfo = { balance: 0, lamports: 0, currency: 'SOL' };
        try {
            balanceInfo = await getOnChainBalance(addressStr);
        } catch (e) {
            log1(["Warning: Could not fetch balance immediately after keygen:", e.message]);
        };

        const walletRecord = await Wallet.findOne({ type: 'PLATFORM_DEPOSIT', isActive: true }).lean();

        return successResponse("New Admin Wallet Address generated successfully!", {
            address: addressStr,
            balance: balanceInfo.balance,
            lamports: balanceInfo.lamports,
            currency: balanceInfo.currency,
            network: walletRecord ? walletRecord.network : (process.env.SOLANA_NETWORK || 'devnet'),
            createdAt: walletRecord ? walletRecord.createdAt : new Date(),
        });
    } catch (err) {
        log1(['Error in admin/wallet/generate API route:', err.message]);
        return errorResponse(err.message || messages.unexpectedDataError);
    };
};

const dynamic = 'force-dynamic';

module.exports = { dynamic, POST };
