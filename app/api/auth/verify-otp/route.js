const constants = require('../../../../lib/constants');
const messages = require('../../../../lib/messages');
const User = require('../../../../lib/models/user.model');
const OTP = require('../../../../lib/models/otp.model');
const { createSessionRecord } = require('../../../../lib/session');
const { errorResponse, successResponse, log1 } = require("../../../../lib/general");
const customValidation = require("../../../../lib/validator");

async function POST(req) {
    try {
        const body = await req.json();
        const { email, otp } = body;

        const validation = await customValidation(req.body, "auth.verify_otp");
        if (!validation.flag === 0) {
            return validation;
        } else if (!(constants.EMAIL_REGEX).test(email)) {
            return errorResponse("Please provide a valid email address.");
        } else if (otp.toString().trim().length !== constants.OTP_LENGTH) {
            return errorResponse("Please provide a valid 6-digit OTP code.");
        };

        const cleanEmail = email.trim().toLowerCase();
        const cleanOtp = otp.trim();

        let user = await User.findOne({ email: cleanEmail });
        if (!user) {
            return errorResponse("User account not found.");
        };

        const otpRecord = await OTP.findOne({
            email: cleanEmail,
            otp: cleanOtp,
            verificationOtpExpires: { $gt: new Date() },
        });

        if (!otpRecord) {
            return errorResponse("Invalid or expired OTP verification code.");
        };

        const isNewRegistration = user.status !== constants.USER_STATUS.ACTIVE;

        user.status = constants.USER_STATUS.ACTIVE;
        await user.save();

        await OTP.deleteMany({ email: cleanEmail });

        if (user.twoFAStatus === constants.TwoFA_STATUS.ENABLED) {
            return successResponse("2FA Verification Required.",
                {
                    requires2FA: true,
                    email: user.email,
                    tempUserId: user._id,
                },
            );
        };

        const userAgent = req.headers.get('user-agent') || 'Web-Browser';
        const { authToken } = await createSessionRecord(user._id, userAgent);

        const responseData = {
            user: {
                _id: user._id,
                email: user.email,
                fullName: user.fullName,
                profilePhoto: user.profilePhoto || "",
                memo: user.memo,
                walletBalance: user.walletBalance,
                is2FAEnabled: user.twoFAStatus === constants.TwoFA_STATUS.ENABLED,
            },
        };

        if (isNewRegistration && user.recoveryPhrase) {
            responseData.recoveryPhrase = user.recoveryPhrase;
        };

        const response = successResponse("Authentication successful.", responseData);

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
        log1(['Error in verify-otp API route:', error.message]);
        return errorResponse(messages.unexpectedDataError);
    };
};

module.exports = { POST };