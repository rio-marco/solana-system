const twoFactor = require('node-2fa');
const constants = require('../../../../../lib/constants');
const messages = require('../../../../../lib/messages');
const User = require('../../../../../lib/models/user.model');
const { verifySession } = require('../../../../../lib/session');
const { errorResponse, successResponse, authErrorResponse, log1 } = require("../../../../../lib/general");

async function POST(req) {
    try {
        const sessionAuth = await verifySession(req);
        if (!sessionAuth || !sessionAuth.userId) {
            return authErrorResponse(messages.unauthorizedAccess);
        };

        const body = await req.json();
        const { secret, code } = body;

        if (!secret || !secret.trim()) {
            return errorResponse("2FA secret is required.");
        };

        if (!code || !code.trim() || code.trim().length !== 6) {
            return errorResponse("Please enter a valid 6-digit 2FA code.");
        };

        const verified = twoFactor.verifyToken(secret.trim(), code.trim());
        if (!verified) {
            return errorResponse("Invalid 2FA authentication code. Please check your Authenticator app.");
        };

        const updatedUser = await User.findByIdAndUpdate(
            sessionAuth.userId,
            {
                twoFASecret: secret.trim(),
                twoFAStatus: constants.TwoFA_STATUS.ENABLED,
            },
            { new: true }
        ).lean();

        if (!updatedUser) {
            return errorResponse("User not found.");
        };

        return successResponse("Two-Factor Authentication enabled successfully!", {
            user: {
                _id: updatedUser._id,
                email: updatedUser.email,
                fullName: updatedUser.fullName,
                profilePhoto: updatedUser.profilePhoto || "",
                memo: updatedUser.memo,
                walletBalance: updatedUser.walletBalance,
                is2FAEnabled: true,
            },
        });
    } catch (error) {
        log1(['Error in 2fa/enable API route:', error.message]);
        return errorResponse(messages.unexpectedDataError);
    };
};

module.exports = { POST };