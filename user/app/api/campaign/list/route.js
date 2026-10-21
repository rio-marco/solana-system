'use strict';

const constants = require('../../../../lib/constants');
const messages = require('../../../../lib/messages');
const { verifySession } = require('../../../../lib/session');
const { errorResponse, successResponse, authErrorResponse, log1 } = require('../../../../lib/general');
const Campaign = require('../../../../lib/models/campaign.model');
const Activitie = require('../../../../lib/models/activitie.model');

async function GET(req) {
    try {
        const sessionAuth = await verifySession(req);
        if (!sessionAuth || !sessionAuth.userId) {
            return authErrorResponse(messages.unauthorizedAccess);
        };

        const userId = sessionAuth.userId;

        const { searchParams } = new URL(req.url);
        const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
        const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '10', 10)));
        const skip = (page - 1) * limit;

        const verifiedCampaignIds = await Activitie.distinct('campaign_id', {
            user_id: userId,
            status: constants.ACTIVITY_STATUS.VERIFIED,
        });

        const filter = { _id: { $nin: verifiedCampaignIds } };

        const totalCount = await Campaign.countDocuments(filter);
        const totalPages = Math.ceil(totalCount / limit) || 0;

        const campaigns = await Campaign.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        const activities = campaigns.length
            ? await Activitie.find({
                user_id: userId,
                campaign_id: { $in: campaigns.map((campaign) => campaign._id) },
            }).select('campaign_id status comment_url created_at').lean()
            : [];

        const activityMap = new Map(activities.map((activity) => [String(activity.campaign_id), activity]));

        const campaignList = campaigns.map((campaign) => {
            const activity = activityMap.get(String(campaign._id));

            return {
                ...campaign,
                status: activity ? activity.status : null,
                comment_url: activity ? activity.comment_url : null,
                submitted_at: activity ? activity.created_at : null,
            };
        });

        return successResponse('Campaigns fetched successfully.', {
            campaigns: campaignList,
            totalCount,
            totalPages,
            currentPage: page,
            limit,
        });
    } catch (error) {
        log1(['Error in campaign/list API route:', error.message]);
        return errorResponse(messages.unexpectedDataError);
    };
};

const dynamic = 'force-dynamic';
module.exports = { dynamic, GET };
