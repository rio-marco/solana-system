const constants = require('../../../../lib/constants');
const messages = require('../../../../lib/messages');
const User = require('../../../../lib/models/user.model');
const OTP = require('../../../../lib/models/otp.model');
const { sendMail } = require('../../../../lib/services/mail.service');
const { errorResponse, successResponse, log1, generateOTP } = require("../../../../lib/general");

async function POST(req) {
    try {
        const body = await req.json();
        const { email } = body;

        if (!email || !email.trim() || !(constants.EMAIL_REGEX).test(email.trim())) {
            return errorResponse("Valid email address is required.");
        };

        const cleanEmail = email.trim().toLowerCase();
        const user = await User.findOne({ email: cleanEmail }).lean();

        if (!user) {
            return errorResponse("No account found with this email address.");
        };

        if (user.status === constants.USER_STATUS.SUSPENDED) {
            return errorResponse("Your account is suspended. Please contact support.");
        };

        const otpExpires = new Date(Date.now() + constants.OTP_EXPIRY_MINUTE);
        const directUrlExpires = new Date(Date.now() + constants.DIRECT_URL_EXPIRY_MINUTE);

        if (!user) {
            return errorResponse("No account found with this email address.");
        } else if (user.status === constants.USER_STATUS.INACTIVE) {
            await OTP.findOneAndUpdate({ email: cleanEmail },
                {
                    verificationOtpExpires: otpExpires,
                    directUrlExpires: directUrlExpires,
                },
                { new: true },
            );

            return successResponse("Your account is not verified. Please complete the verification process.", { email: cleanEmail });
        } else if (user.status === constants.USER_STATUS.SUSPENDED) {
            return errorResponse("Your account is suspended. Please contact support.");
        };

        await OTP.deleteMany({ email: cleanEmail });

        const otpCode = generateOTP(constants.OTP_LENGTH);
        const verificationToken = uuidv4();

        const otpPayload = {
            email: cleanEmail,
            otp: otpCode,
            type: constants.OTP_TYPE.LOGIN,
            verificationToken: verificationToken,
            verificationOtpExpires: otpExpires,
            directUrlExpires: directUrlExpires,
        };

        await OTP.create(otpPayload);

        const origin = req.nextUrl ? req.nextUrl.origin : (process.env.NODE_URL || 'http://localhost:3000');
        const loginUrl = `${origin}/api/auth/direct-login?email=${encodeURIComponent(cleanEmail)}&token=${encodeURIComponent(verificationToken)}`;

        try {
            await sendMail({
                from: process.env.MAIL_FROM_ADDRESS || constants.SUPPORT_EMAIL,
                to: cleanEmail,
                subject: `Login Verification Code - ${constants.PLATFORM_NAME}`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #07090e; color: #f8fafc; border-radius: 12px; border: 1px solid #1e293b;">
                        <h2 style="color: #14F195; margin-bottom: 20px;">Solana Platform Login</h2>
                        <p style="font-size: 16px; line-height: 1.5; color: #cbd5e1;">Your login verification code is:</p>
                        <div style="background-color: #0f1422; border: 1px solid #9945FF; border-radius: 8px; padding: 16px; text-align: center; font-size: 28px; font-weight: bold; letter-spacing: 6px; color: #14F195; margin: 20px 0;">
                            ${otpCode}
                        </div>
                        <p style="font-size: 14px; color: #94a3b8;">This code will expire in ${constants.OTP_EXPIRY_MINUTE / (1000 * 60) || 10} minutes. If you did not request this login, please ignore this email.</p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${loginUrl}" style="background-color: #9945FF; color: #ffffff; padding: 14px 28px; text-decoration: none; font-weight: bold; border-radius: 8px; font-size: 16px; display: inline-block;">
                                Sign In Now
                            </a>
                        </div>
                        <p style="font-size: 14px; color: #94a3b8;">This link will expire in ${constants.DIRECT_URL_EXPIRY_MINUTE / (1000 * 60) || 10} minutes.</p>
                    </div>
                `,
            });
        } catch (mailErr) {
            log1(['Mail send warning:', mailErr.message]);
        };

        return successResponse("OTP sent to your email address.", { email: cleanEmail });
    } catch (error) {
        log1(['Error in login API route:', error.message]);
        return errorResponse(messages.unexpectedDataError);
    };
};

module.exports = { POST };