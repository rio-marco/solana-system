const messages = require('../../../../lib/messages');
const { verifySession } = require('../../../../lib/session');
const { errorResponse, successResponse, authErrorResponse, log1 } = require("../../../../lib/general");
const Deposit = require('../../../../lib/models/deposit.model');
const User = require('../../../../lib/models/user.model');

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

        const filter = {};

        if (statusFilter && statusFilter !== 'ALL') {
            filter.status = statusFilter;
        };

        if (searchQuery) {
            // Find users matching search name or email
            const matchedUsers = await User.find({
                $or: [
                    { email: { $regex: searchQuery, $options: 'i' } },
                    { fullName: { $regex: searchQuery, $options: 'i' } },
                ],
            }).select('_id').lean();

            const userIds = matchedUsers.map((u) => u._id);

            filter.$or = [
                { depositId: { $regex: searchQuery, $options: 'i' } },
                { memo: { $regex: searchQuery, $options: 'i' } },
                { transactionSignature: { $regex: searchQuery, $options: 'i' } },
                { platformAddress: { $regex: searchQuery, $options: 'i' } },
            ];

            if (userIds.length > 0) {
                filter.$or.push({ userId: { $in: userIds } });
            };
        };

        const totalCount = await Deposit.countDocuments(filter);
        const totalPages = Math.ceil(totalCount / limit) || 1;

        const deposits = await Deposit.find(filter)
            .populate('userId', 'fullName email memo')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        return successResponse("All user deposits fetched successfully.", {
            deposits,
            totalCount,
            totalPages,
            currentPage: page,
            limit,
        });
    } catch (err) {
        log1(['Error in admin/deposits API route:', err.message]);
        return errorResponse(err.message || messages.unexpectedDataError);
    };
};

const dynamic = 'force-dynamic';

module.exports = { dynamic, GET };