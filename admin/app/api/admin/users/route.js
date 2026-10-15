'use strict';

const messages = require('../../../../lib/messages');
const { verifySession } = require('../../../../lib/session');
const { errorResponse, successResponse, authErrorResponse, log1, buildProfilePhotoUrl } = require('../../../../lib/general');
const User = require('../../../../lib/models/user.model');
const constants = require('../../../../lib/constants');

async function GET(req) {
    try {
        const sessionAuth = await verifySession(req);
        if (!sessionAuth || !sessionAuth.adminId) {
            return authErrorResponse(messages.unauthorizedAccess);
        };

        const { searchParams } = new URL(req.url);
        const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
        const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10', 10)));
        const skip = (page - 1) * limit;

        const name = (searchParams.get('name') || '').trim();
        const email = (searchParams.get('email') || '').trim();
        const status = searchParams.get('status') || '';
        const twoFAStatus = searchParams.get('twoFAStatus') || '';

        const query = {};

        if (name) {
            query.fullName = { $regex: name, $options: 'i' };
        };

        if (email) {
            query.email = { $regex: email, $options: 'i' };
        };

        if (status && status !== 'ALL') {
            const statusNum = parseInt(status, 10);
            if (!isNaN(statusNum)) {
                query.status = statusNum;
            };
        };

        if (twoFAStatus && twoFAStatus !== 'ALL') {
            const twoFANum = parseInt(twoFAStatus, 10);
            if (!isNaN(twoFANum)) {
                query.twoFAStatus = twoFANum;
            };
        };

        const [users, totalCount] = await Promise.all([
            User.find(query)
                .select('-twoFASecret -recoveryPhrase')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),

            User.countDocuments(query),
        ]);

        const updatedUsers = users.map((user) => ({
            ...user,
            profilePhoto: buildProfilePhotoUrl(user.profilePhoto),
        }));

        const totalPages = Math.ceil(totalCount / limit);

        return successResponse('Users fetched successfully.', {
            users: updatedUsers,
            totalCount,
            totalPages,
            currentPage: page,
            limit,
        });
    } catch (error) {
        log1(['Error in admin users GET:', error.message]);
        return errorResponse(messages.unexpectedDataError);
    };
};

const dynamic = 'force-dynamic';
module.exports = { dynamic, GET };