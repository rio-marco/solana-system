const { v4: uuidv4 } = require('uuid');
const constants = require('../../../../lib/constants');
const messages = require('../../../../lib/messages');
const User = require('../../../../lib/models/user.model');
const OTP = require('../../../../lib/models/otp.model');
const { sendMail } = require('../../../../lib/services/mail.service');
const { errorResponse, successResponse, log1, generateOTP } = require("../../../../lib/general");

async function POST(req) {
    try {
        const body = await req.json();
        const { recoveryPhrase } = body;

        if (!recoveryPhrase || typeof recoveryPhrase !== 'string' || !recoveryPhrase.trim()) {
            return errorResponse("Please enter your 12-word recovery phrase.");
        };

        const cleanPhrase = recoveryPhrase.trim().toLowerCase().replace(/\s+/g, ' ');
        const words = cleanPhrase.split(' ');
        const wordCount = words.length;

        if (wordCount !== 12) {
            return errorResponse(`Recovery phrase must be exactly 12 words. You entered ${wordCount} word(s).`);
        };

        const user = await User.findOne({
            recoveryPhrase: cleanPhrase,
            status: constants.USER_STATUS.ACTIVE,
        }).lean();

        const successMsg = "Login link has been sent to your registered email address.";

        if (!user) {
            return successResponse(successMsg);
        };

        const otpCode = generateOTP(constants.OTP_LENGTH);
        const verificationToken = uuidv4();
        const otpExpires = new Date(Date.now() + constants.OTP_EXPIRY_MINUTE);
        const directUrlExpires = new Date(Date.now() + constants.DIRECT_URL_EXPIRY_MINUTE);

        await OTP.deleteMany({ email: user.email });

        await OTP.create({
            email: user.email,
            otp: otpCode,
            type: constants.OTP_TYPE.LOGIN,
            verificationToken: verificationToken,
            verificationOtpExpires: otpExpires,
            directUrlExpires: directUrlExpires,
        });

        const origin = req.nextUrl ? req.nextUrl.origin : (process.env.NODE_URL);
        const loginUrl = `${origin}/api/auth/direct-login?email=${encodeURIComponent(user.email)}&token=${encodeURIComponent(verificationToken)}`;

        sendMail({
            from: process.env.MAIL_FROM_ADDRESS || constants.SUPPORT_EMAIL,
            to: user.email,
            subject: `Account Recovery Direct Login - ${constants.PLATFORM_NAME}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #07090e; color: #f8fafc; border-radius: 12px; border: 1px solid #1e293b;">
                    <h2 style="color: #14F195; margin-bottom: 20px;">Account Recovery</h2>
                    <p style="font-size: 16px; line-height: 1.5; color: #cbd5e1;">Hi <strong>${user.fullName}</strong>,</p>
                    <p style="font-size: 16px; line-height: 1.5; color: #cbd5e1;">Click the button below to complete account recovery and sign in directly:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${loginUrl}" style="background-color: #9945FF; color: #ffffff; padding: 14px 28px; text-decoration: none; font-weight: bold; border-radius: 8px; font-size: 16px; display: inline-block;">
                            Sign In Now
                        </a>
                    </div>
                    <p style="font-size: 14px; color: #94a3b8;">This link will expire in ${process.env.LOGIN_URL_EXPIRY_IN_MINUTE || 10} minutes.</p>
                </div>
            `,
        }).catch((mailErr) => {
            log1(['Mail send warning:', mailErr.message]);
        });

        return successResponse("Recovery email sent. Please check your registered email inbox.", { email: user.email });
    } catch (error) {
        log1(['Error in account-recovery API route:', error.message]);
        return errorResponse(messages.unexpectedDataError);
    };
};

module.exports = { POST };