const messages = require('../../../../lib/messages');
const { verifySession } = require('../../../../lib/session');
const { errorResponse, successResponse, authErrorResponse, log1 } = require("../../../../lib/general");
const { getPlatformReceivingAddress, getOnChainBalance } = require('../../../../lib/services/solana.service');
const Deposit = require('../../../../lib/models/deposit.model');
const Withdrawal = require('../../../../lib/models/withdrawal.model');
const User = require('../../../../lib/models/user.model');

async function GET(req) {
    try {
        const sessionAuth = await verifySession(req);
        if (!sessionAuth || !sessionAuth.adminId) {
            return authErrorResponse(messages.unauthorizedAccess);
        };

        const pubKey = await getPlatformReceivingAddress(true);
        const addressStr = pubKey ? pubKey.toBase58() : '';

        let onChainBalance = 0;
        if (addressStr) {
            try {
                const balInfo = await getOnChainBalance(addressStr);
                onChainBalance = balInfo.balance;
            } catch (e) {
                log1(["Could not fetch on-chain balance for stats:", e.message]);
            };
        };

        const totalUsers = await User.countDocuments();

        // Deposits Stats (matching addressStr if present, or all platform deposits)
        const depositMatchQuery = addressStr ? { platformAddress: addressStr } : {};
        const withdrawMatchQuery = addressStr ? { fromAddress: addressStr } : {};

        const depositAgg = await Deposit.aggregate([
            { $match: depositMatchQuery },
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 },
                    totalAmount: { $sum: "$amount" },
                },
            },
        ]);

        let depositStats = {
            totalCount: 0,
            confirmedCount: 0,
            pendingCount: 0,
            failedCount: 0,
            confirmedAmount: 0,
            pendingAmount: 0,
            failedAmount: 0,
        };

        depositAgg.forEach((item) => {
            depositStats.totalCount += item.count;
            if (item._id === 'CONFIRMED') {
                depositStats.confirmedCount = item.count;
                depositStats.confirmedAmount = item.totalAmount;
            } else if (item._id === 'PENDING' || item._id === 'PROCESSING') {
                depositStats.pendingCount += item.count;
                depositStats.pendingAmount += item.totalAmount;
            } else if (item._id === 'FAILED') {
                depositStats.failedCount = item.count;
                depositStats.failedAmount = item.totalAmount;
            };
        });

        // Withdrawal Stats
        const withdrawalAgg = await Withdrawal.aggregate([
            { $match: withdrawMatchQuery },
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 },
                    totalAmount: { $sum: "$amount" },
                },
            },
        ]);

        let withdrawalStats = {
            totalCount: 0,
            confirmedCount: 0,
            pendingCount: 0,
            failedCount: 0,
            confirmedAmount: 0,
            pendingAmount: 0,
            failedAmount: 0,
        };

        withdrawalAgg.forEach((item) => {
            withdrawalStats.totalCount += item.count;
            if (item._id === 'CONFIRMED') {
                withdrawalStats.confirmedCount = item.count;
                withdrawalStats.confirmedAmount = item.totalAmount;
            } else if (item._id === 'PENDING' || item._id === 'PROCESSING') {
                withdrawalStats.pendingCount += item.count;
                withdrawalStats.pendingAmount += item.totalAmount;
            } else if (item._id === 'FAILED') {
                withdrawalStats.failedCount = item.count;
                withdrawalStats.failedAmount = item.totalAmount;
            };
        });

        const netVolume = depositStats.confirmedAmount - withdrawalStats.confirmedAmount;

        return successResponse("Admin financial statistics fetched successfully.", {
            address: addressStr,
            onChainBalance,
            totalUsers,
            deposits: depositStats,
            withdrawals: withdrawalStats,
            netVolume: Number(netVolume.toFixed(8)),
        });
    } catch (err) {
        log1(['Error in admin/stats API route:', err.message]);
        return errorResponse(err.message || messages.unexpectedDataError);
    };
};

const dynamic = 'force-dynamic';

module.exports = { dynamic, GET };