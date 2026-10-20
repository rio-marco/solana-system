'use strict';

const cron = require('node-cron');

const constants = require('../constants');
const { log1 } = require('../general');
const Activitie = require('../models/activitie.model');
const User = require('../models/user.model');
const Setting = require('../models/setting.model');
const Campaign = require('../models/campaign.model');

const MS_PER_DAY = 24 * 60 * 60 * 1000;

let isRunning = false;

const processRewardUnlocks = async () => {
    if (isRunning) {
        log1(['[Reward Unlock Cron] A previous execution is still in progress. Skipping this run.']);
        return;
    };

    isRunning = true;

    try {
        const raw = await Setting.getVal('UNLOCK_PERIOD_IN_DAYS', null);
        const days = parseInt(String(raw ?? '').trim(), 10);

        if (!Number.isFinite(days) || days < 0) {
            log1(['[Reward Unlock Cron] UNLOCK_PERIOD_IN_DAYS is missing or invalid; skipping run.']);
            return;
        };

        const cutoff = new Date(Date.now() - days * MS_PER_DAY);

        const activities = await Activitie.find({
            status: constants.ACTIVITY_STATUS.VERIFIED,
            rewarded: true,
            rewardUnlocked: constants.REWARD_UNLOCKED_STATUS.PENDING,
            created_at: { $lte: cutoff },
        }).populate('campaign_id', 'rewards').lean();

        if (!activities || activities.length === 0) return;

        const userTotals = new Map();

        for (const activity of activities) {
            const campaign = activity.campaign_id;
            const reward = campaign && Number.isFinite(Number(campaign.rewards)) ? Number(campaign.rewards) : 0;
            const userId = String(activity.user_id);

            const entry = userTotals.get(userId) || { total: 0, activityIds: [] };
            entry.total += reward;
            entry.activityIds.push(activity._id);
            userTotals.set(userId, entry);
        };

        let unlockedUsers = 0;
        let unlockedActivities = 0;
        let totalUnlocked = 0;

        for (const [userId, entry] of userTotals) {
            try {
                const activityIds = entry.activityIds;
                const totalReward = entry.total;

                const claimResult = await Activitie.updateMany(
                    { _id: { $in: activityIds }, rewardUnlocked: constants.REWARD_UNLOCKED_STATUS.PENDING },
                    { $set: { rewardUnlocked: constants.REWARD_UNLOCKED_STATUS.COMPLETE } },
                );

                if (!claimResult || claimResult.matchedCount === 0) continue;

                const updateResult = await User.updateOne(
                    { _id: userId },
                    { $inc: { availableWithdrawBalance: totalReward } },
                    { new: true }
                );

                if (!updateResult || updateResult.matchedCount === 0) {
                    await Activitie.updateMany(
                        { _id: { $in: activityIds } },
                        { $set: { rewardUnlocked: constants.REWARD_UNLOCKED_STATUS.PENDING } },
                    );
                    continue;
                };

                unlockedUsers++;
                unlockedActivities += activityIds.length;
                totalUnlocked += totalReward;
            } catch (err) {
                log1([`[Reward Unlock Cron] Failed to unlock rewards for user ${userId}:`, err.message]);
            };
        };

        if (unlockedActivities > 0) {
            log1([`[Reward Unlock Cron] Unlocked ${totalUnlocked} BTCR across ${unlockedActivities} activities for ${unlockedUsers} users.`]);
        };
    } catch (err) {
        log1(['[Reward Unlock Cron] Run failed:', err.message]);
    } finally {
        isRunning = false;
    };
};

const initCronJobs = () => {

    /**
     * For Run Reward Unlock Cron Schedule every 30 Minute
     */
    cron.schedule('*/30 * * * *', async () => {
        log1(['[Reward Unlock Cron] Scheduled job execution started.']);

        try {
            await processRewardUnlocks();
        } catch (error) {
            log1(['[Reward Unlock Cron] Scheduled job execution failed:', error]);
        };
    }, { timezone: constants.CURRENT_TIMEZONE });
};

module.exports = {
    initCronJobs,
    processRewardUnlocks,
};
