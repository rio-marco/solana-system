'use strict';

const cron = require('node-cron');
const moment = require('moment');
const constants = require('../constants');
const { log1 } = require('../general');
const User = require('../models/user.model');
const Setting = require('../models/setting.model');
const Transaction = require('../models/transaction.model');

const MS_PER_DAY = 24 * 60 * 60 * 1000;

let isRunning = false;

const processTransactionUnlocks = async () => {
    if (isRunning) {
        log1(['[Transaction Unlock Cron] A previous execution is still in progress. Skipping this run.']);
        return;
    };

    isRunning = true;

    try {
        const raw = await Setting.getVal('UNLOCK_PERIOD_IN_DAYS', null);
        const days = parseInt(String(raw ?? '').trim(), 10);

        if (!Number.isFinite(days) || days < 0) {
            log1(['[Transaction Unlock Cron]: UNLOCK_PERIOD_IN_DAYS is missing or invalid; skipping run.']);
            return;
        };

        // const cutoff = new Date(Date.now() - days * MS_PER_DAY);
        const cutoff = moment().subtract(days, 'days').toDate();
        log1(['[Transaction Unlock Cron] Cutoff time:', cutoff]);
        log1(['[Transaction Unlock Cron] moment Cutoff time:', moment(cutoff).format('YYYY-MM-DD HH:mm:ss.SSS Z')]);

        const transactionsList = await Transaction.find({
            type: constants.TRX_TYPE.CREDIT,
            status: constants.TRANSACTION_STATUS.CONFIRMED,
            trxUnlocked: constants.TRX_UNLOCKED_STATUS.PENDING,
            createdAt: { $lte: cutoff },
        }).lean();

        log1([`[Transaction Unlock Cron]: Found ${transactionsList.length} transactions to check.`]);

        if (!transactionsList || transactionsList.length === 0) return;

        const userTotals = new Map();

        for (const trx of transactionsList) {
            const trxAmount = Number.isFinite(Number(trx.amount)) ? Number(trx.amount) : 0;
            const userId = String(trx.userId);

            const entry = userTotals.get(userId) || { total: 0, transactionIds: [] };
            entry.total += trxAmount;
            entry.transactionIds.push(trx._id);
            userTotals.set(userId, entry);
        };

        let unlockedUsers = 0;
        let unlockedTransactions = 0;
        let totalUnlocked = 0;

        for (const [userId, entry] of userTotals) {
            try {
                const transactionIds = entry.transactionIds;
                const totalTransaction = entry.total;

                const claimResult = await Transaction.updateMany(
                    { _id: { $in: transactionIds }, trxUnlocked: constants.TRX_UNLOCKED_STATUS.PENDING },
                    { $set: { trxUnlocked: constants.TRX_UNLOCKED_STATUS.COMPLETE } },
                );

                if (!claimResult || claimResult.matchedCount === 0) continue;

                const updateResult = await User.updateOne(
                    { _id: userId },
                    { $inc: { availableWithdrawBalance: totalTransaction } },
                    { new: true }
                );

                if (!updateResult || updateResult.matchedCount === 0) {
                    await Transaction.updateMany(
                        { _id: { $in: transactionIds } },
                        { $set: { trxUnlocked: constants.TRX_UNLOCKED_STATUS.PENDING } },
                    );
                    continue;
                };

                unlockedUsers++;
                unlockedTransactions += transactionIds.length;
                totalUnlocked += totalTransaction;
            } catch (err) {
                log1([`[Transaction Unlock Cron] Failed to unlock transaction amount for user ${userId}:`, err.message]);
            };
        };

        if (unlockedTransactions > 0) {
            log1([`[Transaction Unlock Cron] Unlocked ${totalUnlocked} BTCR across ${unlockedTransactions} transactions for ${unlockedUsers} users.`]);
        };
    } catch (err) {
        log1(['[Transaction Unlock Cron] Run failed:', err.message]);
    } finally {
        isRunning = false;
    };
};

const initCronJobs = () => {

    /**
     * For Run Transaction Unlock Cron Schedule every Minute
     */
    cron.schedule('* * * * *', async () => {
        log1(['[Transaction Unlock Cron] Scheduled job execution started.']);

        try {
            await processTransactionUnlocks();
        } catch (error) {
            log1(['[Transaction Unlock Cron] Scheduled job execution failed:', error]);
        };
    }, { timezone: constants.CURRENT_TIMEZONE });
};

module.exports = {
    initCronJobs,
    processTransactionUnlocks,
};
