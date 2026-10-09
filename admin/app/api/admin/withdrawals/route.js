const messages = require('../../../../lib/messages');
const { verifySession } = require('../../../../lib/session');
const { errorResponse, successResponse, authErrorResponse, log1 } = require("../../../../lib/general");
const Withdrawal = require('../../../../lib/models/withdrawal.model');
const User = require('../../../../lib/models/user.model');
const Setting = require('../../../../lib/models/setting.model');

async function GET(req) {
    try {
        const sessionAuth = await verifySession(req);
        if (!sessionAuth || !sessionAuth.adminId) {
            return authErrorResponse(messages.unauthorizedAccess);
        };

        const { searchParams } = new URL(req.url);
        const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
        const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '10', 10)));
        const skip = (page - 1) * limit;
        const statusFilter = searchParams.get('status') || 'ALL';
        const searchQuery = (searchParams.get('search') || '').trim();

        const pubKeyStr = (await Setting.getVal('SOLANA_PLATFORM_PUBLIC_KEY'));

        const filter = {
            fromAddress: pubKeyStr,
        };

        if (statusFilter && statusFilter !== 'ALL') {
            filter.status = statusFilter;
        };

        if (searchQuery) {
            const matchedUsers = await User.find({
                $or: [
                    { email: { $regex: searchQuery, $options: 'i' } },
                    { fullName: { $regex: searchQuery, $options: 'i' } },
                ],
            }).select('_id').lean();

            const userIds = matchedUsers.map((u) => u._id);

            filter.$or = [
                { withdrawId: { $regex: searchQuery, $options: 'i' } },
                { memo: { $regex: searchQuery, $options: 'i' } },
                { toAddress: { $regex: searchQuery, $options: 'i' } },
                { transactionSignature: { $regex: searchQuery, $options: 'i' } },
            ];

            if (userIds.length > 0) {
                filter.$or.push({ userId: { $in: userIds } });
            };
        };

        const totalCount = await Withdrawal.countDocuments(filter);
        const totalPages = Math.ceil(totalCount / limit) || 0;

        const withdrawals = await Withdrawal.find(filter)
            .populate('userId', 'fullName email memo')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        return successResponse("All user withdrawals fetched successfully.", {
            withdrawals,
            totalCount,
            totalPages,
            currentPage: page,
            limit,
        });
    } catch (err) {
        log1(['Error in admin/withdrawals API route:', err.message]);
        return errorResponse(err.message || messages.unexpectedDataError);
    };
};

const dynamic = 'force-dynamic';

module.exports = { dynamic, GET };