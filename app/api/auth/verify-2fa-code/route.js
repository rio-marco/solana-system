const twoFactor = require('node-2fa');
const constants = require('../../../../lib/constants');
const messages = require('../../../../lib/messages');
const User = require('../../../../lib/models/user.model');
const { createSessionRecord } = require('../../../../lib/session');
const { errorResponse, successResponse, log1 } = require("../../../../lib/general");

async function POST(req) {
    try {
        const body = await req.json();
        const { email, code, tempUserId } = body;

        if (!code || !code.trim()) {
            return errorResponse("2FA authentication code is required.");
        };

        let user = null;
        if (tempUserId) {
            user = await User.findById(tempUserId);
        } else if (email) {
            user = await User.findOne({ email: email.trim().toLowerCase() });
        };

        if (!user || !user.twoFASecret) {
            return errorResponse("Invalid user or 2FA secret not configured.");
        };

        const verified = twoFactor.verifyToken(user.twoFASecret, code.trim());
        if (!verified || verified.delta !== 0) {
            return errorResponse("Invalid 2FA authentication code.");
        };

        const userAgent = req.headers.get('user-agent') || 'Web-Browser';
        const { authToken } = await createSessionRecord(user._id, userAgent);

        const response = successResponse("2FA Verification successful.",
            {
                user: {
                    _id: user._id,
                    email: user.email,
                    fullName: user.fullName,
                    profilePhoto: user.profilePhoto || "",
                    memo: user.memo,
                    walletBalance: user.walletBalance,
                    is2FAEnabled: true,
                },
            },
        );

        const cookieOptions = {
            httpOnly: true,
            secure: false,
            sameSite: 'lax',
            path: '/',
            maxAge: Math.floor(constants.SESSION_MAX_AGE / 1000),
        };

        response.cookies.set('authToken', authToken, cookieOptions);
        response.cookies.set(constants.PLATFORM_NAME, authToken, cookieOptions);

        return response;
    } catch (error) {
        log1(['Error in verify-2fa-code API route:', error.message]);
        return errorResponse(messages.unexpectedDataError);
    };
};

module.exports = { POST };