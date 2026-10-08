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
        const { code } = body;

        if (!code || !code.trim() || code.trim().length !== 6) {
            return errorResponse("Please enter a valid 6-digit 2FA code.");
        };

        const user = await User.findById(sessionAuth.userId);
        if (!user || user.twoFAStatus !== constants.TwoFA_STATUS.ENABLED || !user.twoFASecret) {
            return errorResponse("2FA is not enabled on this account.");
        };

        const verified = twoFactor.verifyToken(user.twoFASecret, code.trim());
        if (!verified) {
            return errorResponse("Invalid 2FA authentication code.");
        };

        user.twoFASecret = null;
        user.twoFAStatus = constants.TwoFA_STATUS.DISABLED;
        await user.save();

        return successResponse("Two-Factor Authentication disabled successfully!", {
            user: {
                _id: user._id,
                email: user.email,
                fullName: user.fullName,
                profilePhoto: user.profilePhoto || "",
                memo: user.memo,
                walletBalance: user.walletBalance,
                is2FAEnabled: false,
            },
        });
    } catch (error) {
        log1(['Error in 2fa/disable API route:', error.message]);
        return errorResponse(messages.unexpectedDataError);
    };
};

module.exports = { POST };