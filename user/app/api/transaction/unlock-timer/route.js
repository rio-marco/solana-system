const moment = require('moment');
const constants = require('../../../../lib/constants');
const messages = require('../../../../lib/messages');
const { verifySession } = require('../../../../lib/session');
const { errorResponse, successResponse, authErrorResponse, log1 } = require("../../../../lib/general");
const Transaction = require('../../../../lib/models/transaction.model');
const Setting = require('../../../../lib/models/setting.model');

const MS_PER_DAY = 24 * 60 * 60 * 1000;

async function GET(req) {
    try {
        const sessionAuth = await verifySession(req);
        if (!sessionAuth || !sessionAuth.userId) {
            return authErrorResponse(messages.unauthorizedAccess);
        };

        const raw = await Setting.getVal('UNLOCK_PERIOD_IN_DAYS');
        const unlockPeriodInDays = parseInt(String(raw ?? '').trim(), 10);

        if (!Number.isFinite(unlockPeriodInDays) || unlockPeriodInDays < 0) {
            return successResponse("Pending unlock transactions fetched successfully.", {
                transactions: [],
                unlockPeriodInDays: null,
                totalCount: 0,
                totalPages: 0,
                currentPage: constants.DEFAULT_CURRENT_PAGE,
                limit: constants.DEFAULT_ITEM_PER_PAGE,
                serverNow: new Date(),
            });
        };

        const { searchParams } = new URL(req.url);
        const page = Math.max(1, parseInt(searchParams.get('page') || constants.DEFAULT_CURRENT_PAGE, 10));
        const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || constants.DEFAULT_ITEM_PER_PAGE, 10)));
        const skip = (page - 1) * limit;

        // const now = Date.now();
        // const unlockCutoff = new Date(now - unlockPeriodInDays * MS_PER_DAY);
        // const unlockCutoff = moment().subtract(unlockPeriodInDays, 'days').toDate();

        const filter = {
            userId: sessionAuth.userId,
            type: constants.TRX_TYPE.CREDIT,
            status: constants.TRANSACTION_STATUS.CONFIRMED,
            trxUnlocked: constants.TRX_UNLOCKED_STATUS.PENDING,
            // createdAt: { $gt: unlockCutoff },
        };

        const totalCount = await Transaction.countDocuments(filter);
        const totalPages = Math.ceil(totalCount / limit) || 0;

        const transactions = await Transaction.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        const data = (transactions || []).map((tx) => ({
            ...tx,
            // unlockAt: new Date(new Date(tx.createdAt).getTime() + unlockPeriodInDays * MS_PER_DAY),
            unlockAt: moment(tx.createdAt).add(unlockPeriodInDays, 'days').toDate(),
        }));

        return successResponse("Pending unlock transactions fetched successfully.", {
            transactions: data,
            unlockPeriodInDays,
            totalCount,
            totalPages,
            currentPage: page,
            limit,
            serverNow: new Date(),
        });
    } catch (err) {
        log1(['Error in transaction/unlock-timer API route:', err.message]);
        return errorResponse(messages.unexpectedDataError);
    };
};

const dynamic = 'force-dynamic';

module.exports = { dynamic, GET };