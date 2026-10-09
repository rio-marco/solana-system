const { v4: uuidv4 } = require('uuid');
const constants = require('../../../../lib/constants');
const messages = require('../../../../lib/messages');
const User = require('../../../../lib/models/user.model');
const OTP = require('../../../../lib/models/otp.model');
const { sendMail } = require('../../../../lib/services/mail.service');
const {
    errorResponse,
    successResponse,
    log1,
    generateUniqueMemo,
    generateRecoveryPhrase,
    generateOTP,
} = require("../../../../lib/general");
const customValidation = require("../../../../lib/validator");

async function POST(req) {
    try {
        const body = await req.json();
        const { fullName, email } = body;

        const validation = await customValidation(body, "auth.signUp");
        if (validation.flag === 0) {
            return errorResponse(validation.msg || "Validation error");
        } else if (!(constants.FULL_NAME_REGEX).test(fullName)) {
            return errorResponse("Full name must be 2–60 characters long and contain only letters and spaces.");
        } else if (!(constants.EMAIL_REGEX).test(email)) {
            return errorResponse("Please provide a valid email address.");
        };

        const cleanEmail = email.trim().toLowerCase();

        const existingUser = await User.findOne({ email: cleanEmail }).lean();
        if (existingUser) {
            return errorResponse("An active account with this email address already exists. Please login.");
        };

        let uniqueMemo;
        try {
            uniqueMemo = await generateUniqueMemo();
        } catch (error) {
            log1(["Failed to generate referral code----->", error]);
            return errorResponse("Unable to generate memo code. Please try again.");
        };

        const recoveryPhrase = await generateRecoveryPhrase();
        const otpCode = generateOTP(constants.OTP_LENGTH);
        const verificationToken = uuidv4();
        const otpExpires = new Date(Date.now() + constants.OTP_EXPIRY_MINUTE);
        const directUrlExpires = new Date(Date.now() + constants.DIRECT_URL_EXPIRY_MINUTE);

        await OTP.deleteMany({ email: cleanEmail, type: constants.OTP_TYPE.SIGNUP });

        const otpPayload = {
            email: cleanEmail,
            otp: otpCode,
            type: constants.OTP_TYPE.SIGNUP,
            verificationToken: verificationToken,
            verificationOtpExpires: otpExpires,
            directUrlExpires: directUrlExpires,
        };
        await OTP.create(otpPayload);

        const createUserPayload = {
            fullName: fullName.trim(),
            email: cleanEmail,
            memo: uniqueMemo,
            recoveryPhrase: recoveryPhrase,
            walletBalance: 0,
            status: constants.USER_STATUS.INACTIVE,
            twoFAStatus: constants.TwoFA_STATUS.DISABLED,
        };

        const createdUser = await User.create(createUserPayload);
        if (!createdUser) {
            return errorResponse(messages.unexpectedDataError);
        };

        const origin = req.nextUrl ? req.nextUrl.origin : (process.env.NODE_URL);
        const loginUrl = `${origin}/api/auth/direct-login?email=${encodeURIComponent(createdUser.email)}&token=${encodeURIComponent(verificationToken)}`;

        sendMail({
            from: process.env.MAIL_FROM_ADDRESS || constants.SUPPORT_EMAIL,
            to: cleanEmail,
            subject: `Welcome to ${constants.PLATFORM_NAME} - Verify Account`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #07090e; color: #f8fafc; border-radius: 12px; border: 1px solid #1e293b;">
                    <h2 style="color: #14F195; margin-bottom: 20px;">Welcome to Solana Platform</h2>
                    <p style="font-size: 16px; line-height: 1.5; color: #cbd5e1;">Hi <strong>${fullName.trim()}</strong>,</p>
                    <p style="font-size: 16px; line-height: 1.5; color: #cbd5e1;">Your account verification code is:</p>
                    <div style="background-color: #0f1422; border: 1px solid #9945FF; border-radius: 8px; padding: 16px; text-align: center; font-size: 28px; font-weight: bold; letter-spacing: 6px; color: #14F195; margin: 20px 0;">
                        ${otpCode}
                    </div>
                    <p style="font-size: 14px; color: #94a3b8;">This code will expire in ${constants.OTP_EXPIRY_MINUTE / (1000 * 60) || 10} minutes.</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${loginUrl}" style="background-color: #9945FF; color: #ffffff; padding: 14px 28px; text-decoration: none; font-weight: bold; border-radius: 8px; font-size: 16px; display: inline-block;">
                            Sign In Now
                        </a>
                    </div>
                    <p style="font-size: 14px; color: #94a3b8;">This link will expire in ${constants.DIRECT_URL_EXPIRY_MINUTE / (1000 * 60) || 10} minutes.</p>
                </div>
            `,
        }).catch((mailErr) => {
            log1(['Mail send warning:', mailErr.message]);
        });

        return successResponse("Registration successful. OTP sent to your email address.", { email: cleanEmail });
    } catch (error) {
        log1(['Error in signup API route:', error.message]);
        return errorResponse(messages.unexpectedDataError);
    };
};

module.exports = { POST };