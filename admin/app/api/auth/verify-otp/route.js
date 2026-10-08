const constants = require('../../../../lib/constants');
const messages = require('../../../../lib/messages');
const Admin = require('../../../../lib/models/admin.model');
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

        let admin = await Admin.findOne({ email: cleanEmail });
        if (!admin) {
            return errorResponse("Invalid account.");
        };

        const otpRecord = await OTP.findOne({
            email: cleanEmail,
            otp: cleanOtp,
            verificationOtpExpires: { $gt: new Date() },
        });

        if (!otpRecord) {
            return errorResponse("Invalid or expired OTP verification code.");
        };

        await OTP.deleteMany({ email: cleanEmail });

        const adminAgent = req.headers.get('user-agent') || 'Web-Browser';
        const { authToken } = await createSessionRecord(admin._id, adminAgent);

        const response = successResponse("OTP verified successfully!.");

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