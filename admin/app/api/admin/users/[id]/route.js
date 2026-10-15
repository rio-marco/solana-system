'use strict';

const mongoose = require('mongoose');
const messages = require('../../../../../lib/messages');
const constants = require('../../../../../lib/constants');
const { verifySession } = require('../../../../../lib/session');
const { errorResponse, successResponse, authErrorResponse, log1 } = require('../../../../../lib/general');
const User = require('../../../../../lib/models/user.model');
const Deposit = require('../../../../../lib/models/deposit.model');
const Withdrawal = require('../../../../../lib/models/withdrawal.model');

async function GET(req, { params }) {
    try {
        const sessionAuth = await verifySession(req);
        if (!sessionAuth || !sessionAuth.adminId) {
            return authErrorResponse(messages.unauthorizedAccess);
        };

        const userId = params?.id;

        if (!userId || !mongoose.isValidObjectId(userId)) {
            return errorResponse('Invalid user ID.');
        };

        const user = await User.findById(userId).select('-twoFASecret -recoveryPhrase').lean();

        if (!user) {
            return errorResponse('User not found.');
        };

        const backendUrl = process.env.USER_URL;
        const profilePhoto = user.profilePhoto?.trim() || '';
        let profilePhotoUrl = '';

        if (profilePhoto) {
            if (/^https?:\/\//i.test(profilePhoto)) {
                profilePhotoUrl = profilePhoto;
            } else if (backendUrl) {
                profilePhotoUrl = `${backendUrl}/${profilePhoto.replace(/^\/+/, '')}`;
            };
        };

        const userData = { ...user, profilePhoto: profilePhotoUrl };

        return successResponse('User details fetched successfully.', {
            user: userData,
        });
    } catch (error) {
        log1(['Error in admin user details GET:', error.message]);
        return errorResponse(messages.unexpectedDataError);
    };
};

const dynamic = 'force-dynamic';
module.exports = { dynamic, GET };