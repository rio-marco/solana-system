'use strict';

const messages = require('../../../../../../lib/messages');
const { verifySession } = require('../../../../../../lib/session');
const { errorResponse, successResponse, authErrorResponse, log1 } = require('../../../../../../lib/general');
const User = require('../../../../../../lib/models/user.model');
const constants = require('../../../../../../lib/constants');

async function PATCH(req, { params }) {
    try {
        const sessionAuth = await verifySession(req);
        if (!sessionAuth || !sessionAuth.adminId) {
            return authErrorResponse(messages.unauthorizedAccess);
        };

        const userId = params.id;
        if (!userId) {
            return errorResponse('User ID is required.');
        };

        const body = await req.json();
        const { action, reason } = body;

        const validActions = Object.values(constants.USER_STATUS);
        if (!validActions.includes(Number(action))) {
            return errorResponse('Invalid action.');
        };

        const user = await User.findById(userId);
        if (!user) {
            return errorResponse('User not found.');
        };

        user.status = Number(action);

        if (Number(action) === constants.USER_STATUS.SUSPENDED) {
            if (!reason || reason.trim().length < 3) {
                return errorResponse('Suspend reason is required and must be at least 3 characters.');
            };

            user.suspendReason = reason.trim();
            user.suspendHistory.push({
                reason: reason.trim(),
                suspendedAt: new Date(),
                activatedAt: null,
            });
        } else if (Number(action) === constants.USER_STATUS.ACTIVE) {
            // Close last open suspend entry
            if (user.suspendHistory && user.suspendHistory.length > 0) {
                const lastEntry = user.suspendHistory[user.suspendHistory.length - 1];
                if (!lastEntry.activatedAt) {
                    lastEntry.activatedAt = new Date();
                };
            };

            user.suspendReason = null;
        };

        await user.save();

        const updatedUser = await User.findById(userId)
            .select('-twoFASecret -recoveryPhrase')
            .lean();

        return successResponse(`User ${Number(action) === constants.USER_STATUS.SUSPENDED ? 'suspended' : 'activated'} successfully.`, {
            user: updatedUser,
        });
    } catch (error) {
        log1(['Error in admin users status PATCH:', error.message]);
        return errorResponse(messages.unexpectedDataError);
    };
};

const dynamic = 'force-dynamic';
module.exports = { dynamic, PATCH };