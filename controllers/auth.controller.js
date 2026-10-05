const ejs = require('ejs');
const { v4: uuidv4 } = require('uuid');
const Mnemonic = require('bitcore-mnemonic');
const { sendMail } = require('../services/mail.service');
const constants = require('../config/constant');
const generalLib = require('../utils/lib/general.lib');
const messages = require('../utils/messages');
const sessionHelper = require('../utils/helpers/session.helper');
const customValidation = require('../utils/helpers/validator.helper');
const twoFactorAuthLib = require("../utils/helpers/2fa.helper");
const User = require('../models/user.model');
const Session = require('../models/session.model');
const OTP = require('../models/otp.model');

const generateRecoveryPhrase = async () => {
    let phrase = '';
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 5) {
        attempts++;
        const mnemonicObject = new Mnemonic();
        phrase = mnemonicObject.toString();

        const existing = await User.findOne({ recoveryPhrase: phrase }).lean();
        if (!existing) {
            isUnique = true;
        }
    }

    return phrase;
};

const getLoginPage = (req, res) => {
    try {
        if (req.session && req.session.user && req.session.user._id) {
            return res.redirect('/');
        };

        const { error } = req.query;

        const errorMessages = {
            invalid_direct_login: "Invalid or incomplete login link.",
            user_not_found: "User account was not found.",
            expired_direct_login: "This direct login link has expired. Please request a new login link or verify using OTP.",
            session_failed: "Unable to create your login session. Please try again.",
            direct_login_failed: "Unable to complete direct login. Please try again."
        };

        return res.render("login", {
            header: {},
            body: {
                errorMessage: error ? errorMessages[error] || null : null,
            },
            footer: {
                js: ["login.js"],
            },
        });
    } catch (error) {
        generalLib.log1(["Error in getLoginPage----->", error]);
        return res.status(constants.STATUS.INTERNAL_SERVER_ERROR).json(generalLib.error_res(messages.unexpectedDataError));
    };
};

const getSignupPage = (req, res) => {
    try {
        if (req.session && req.session.user && req.session.user._id) {
            return res.redirect('/');
        };

        return res.render("signup", {
            header: {},
            body: {},
            footer: {
                js: ["signup.js"],
            },
        });
    } catch (error) {
        generalLib.log1(["Error in getSignupPage----->", error]);
        return res.status(constants.STATUS.INTERNAL_SERVER_ERROR).json(generalLib.error_res(messages.unexpectedDataError));
    };
};

const getVerifyOtpPage = (req, res) => {
    try {
        if (req.session && req.session.user && req.session.user._id) {
            return res.redirect('/');
        };

        const email = req.query.email;

        if (!email || typeof email !== 'string' || !email.trim()) {
            return res.redirect('/login');
        };

        return res.render("verify-otp", {
            header: {},
            body: {
                email,
            },
            footer: {
                js: ["verify-otp.js"],
            },
        });
    } catch (error) {
        generalLib.log1(["Error in getVerifyOtpPage----->", error]);
        return res.status(constants.STATUS.INTERNAL_SERVER_ERROR).json(generalLib.error_res(messages.unexpectedDataError));
    };
};

const signup = async (req, res, next) => {
    try {
        const { fullName, email } = req.body;

        const validation = await customValidation(req.body, "auth.signUp");
        if (!validation.flag === 0) {
            return res.status(constants.STATUS.BAD_REQUEST).json(validation);
        } else if (!(constants.FULL_NAME_REGEX).test(fullName)) {
            return res.status(constants.STATUS.BAD_REQUEST).json(generalLib.error_res("Full name must be 2–60 characters long and contain only letters and spaces."));
        } else if (!(constants.EMAIL_REGEX).test(email)) {
            return res.status(constants.STATUS.BAD_REQUEST).json(generalLib.error_res("Please provide a valid email address."));
        };

        const cleanEmail = email.trim().toLowerCase();

        const existingUser = await User.findOne({ email: cleanEmail });
        if (existingUser) {
            return res.status(constants.STATUS.BAD_REQUEST).json(generalLib.error_res("An account with this email address already exists."));
        };

        let uniqueMemo;
        try {
            uniqueMemo = await generalLib.generateUniqueMemo();
        } catch (error) {
            generalLib.log1(["Failed to generate referral code----->", error]);
            return res.status(constants.STATUS.BAD_REQUEST).json(generalLib.error_res("Unable to generate memo code. Please try again."));
        };

        const recoveryPhrase = await generateRecoveryPhrase();

        const otpCode = generalLib.generateOtp(constants.OTP_LENGTH);
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
            walletBalance: 0,
            status: constants.USER_STATUS.INACTIVE,
            twoFAStatus: constants.TwoFA_STATUS.DISABLED,
            recoveryPhrase: recoveryPhrase,
        };

        const createdUser = await User.create(createUserPayload);
        if (!createdUser) {
            return res.status(constants.STATUS.INTERNAL_SERVER_ERROR).json(generalLib.error_res(messages.unexpectedDataError));
        };

        const baseUrl = process.env.NODE_URL;
        const directLoginUrl = `${baseUrl}/auth/direct-login?token=${verificationToken}&email=${encodeURIComponent(createdUser.email)}`;

        const mailFile = await ejs.renderFile("views/emails/otp-verification.ejs", {
            title: "New Register OTP",
            userName: createdUser.fullName,
            otpCode: otpCode,
            directLoginUrl: directLoginUrl,
            expireIn: constants.OTP_EXPIRY_MINUTE / (1000 * 60),
        });

        const mailOptions = {
            from: process.env.MAIL_FROM_ADDRESS || process.env.MAIL_USERNAME,
            to: createdUser.email,
            subject: `${otpCode} is your Solana System verification code`,
            html: mailFile,
        };

        const emailSent = await sendMail(mailOptions);
        if (!emailSent) {
            return res.status(constants.STATUS.BAD_REQUEST).json(generalLib.error_res("Failed to send OTP email. Please try again."));
        };

        return res.status(constants.STATUS.OK).json(generalLib.success_res("OTP verification code has been sent to your email. Please verify OTP.", {
            email: createdUser.email,
            redirectUrl: `/verify-otp?email=${encodeURIComponent(createdUser.email)}`,
        }));
    } catch (err) {
        generalLib.log1(["Error in signup----->", err]);
        return res.status(constants.STATUS.INTERNAL_SERVER_ERROR).json(generalLib.error_res(messages.unexpectedDataError));
    };
};

const verifyOtp = async (req, res, next) => {
    try {
        const { email, otp } = req.body;

        const validation = await customValidation(req.body, "auth.verify_otp");
        if (!validation.flag === 0) {
            return res.status(constants.STATUS.BAD_REQUEST).json(validation);
        } else if (!(constants.EMAIL_REGEX).test(email)) {
            return res.status(constants.STATUS.BAD_REQUEST).json(generalLib.error_res("Please provide a valid email address."));
        } else if (otp.toString().trim().length !== constants.OTP_LENGTH) {
            return res.status(constants.STATUS.BAD_REQUEST).json(generalLib.error_res("Please provide a valid 6-digit OTP code."));
        };

        const cleanEmail = email.trim().toLowerCase();
        const cleanOtp = otp.toString().trim();

        const user = await User.findOne({ email: cleanEmail });
        if (!user) {
            return res.status(constants.STATUS.BAD_REQUEST).json(generalLib.error_res("No account found with this email."));
        };

        const isFirstVerification = user.status === constants.USER_STATUS.INACTIVE;

        const verifyOtpDetails = await OTP.findOne({ email: cleanEmail });
        if (!verifyOtpDetails) {
            return res.status(constants.STATUS.BAD_REQUEST).json(generalLib.error_res("Invalid or expired OTP. Please request a new one."));
        };

        if (verifyOtpDetails.otp !== cleanOtp) {
            return res.status(constants.STATUS.BAD_REQUEST).json(generalLib.error_res("Invalid OTP code. Please check and try again."));
        };

        if (verifyOtpDetails.verificationOtpExpires && verifyOtpDetails.verificationOtpExpires < new Date()) {
            return res.status(constants.STATUS.BAD_REQUEST).json(generalLib.error_res("OTP code has expired. Please request a new one."));
        };

        if (verifyOtpDetails?.type === constants.OTP_TYPE.SIGNUP) {
            await User.findOneAndUpdate({ _id: user._id }, { status: constants.USER_STATUS.ACTIVE }, { new: true });
        };

        await OTP.deleteMany({ email: cleanEmail });

        const ip = generalLib.getIp(req);

        if (user.twoFAStatus === constants.TwoFA_STATUS.DISABLED) {
            const sessionDetails = await sessionHelper.generateAndStoreSession(req, ip, user._id);
            if (!sessionDetails) {
                return res.status(constants.STATUS.INTERNAL_SERVER_ERROR).json(generalLib.error_res(messages.unexpectedDataError));
            };

            req.session.user = { _id: user._id.toString(), authToken: sessionDetails?.authToken };

            return res.status(constants.STATUS.OK).json(generalLib.success_res("OTP verified successfully!", {
                redirectUrl: "/",
                recoveryPhrase: isFirstVerification ? user.recoveryPhrase : null,
                isFirstVerification,
            }));
        };

        return res.status(constants.STATUS.OK).json(generalLib.success_res("Please verify your 2FA code.", { redirectUrl: "/verify-2fa" }));
    } catch (err) {
        generalLib.log1(["Error in verifyOtp----->", err]);
        return res.status(constants.STATUS.INTERNAL_SERVER_ERROR).json(generalLib.error_res(messages.unexpectedDataError));
    };
};

const directLoginLink = async (req, res, next) => {
    try {
        const { token, email } = req.query;

        if (!token || !email) {
            return res.redirect('/login?error=invalid_direct_login');
        };

        const cleanEmail = email.trim().toLowerCase();

        const user = await User.findOne({ email: cleanEmail });

        if (!user) {
            return res.redirect('/login?error=user_not_found');
        };

        const verifyOtpDetails = await OTP.findOne({
            email: cleanEmail,
            verificationToken: token,
        });
        if (!verifyOtpDetails) {
            return res.redirect('/login?error=invalid_direct_login');
        };

        if (verifyOtpDetails.directUrlExpires && verifyOtpDetails.directUrlExpires < new Date()) {
            return res.redirect(
                `/login?error=expired_direct_login&email=${encodeURIComponent(user.email)}`
            );
        };

        await User.findOneAndUpdate({ _id: user._id }, { status: constants.USER_STATUS.ACTIVE }, { new: true });

        const ip = generalLib.getIp(req);

        const sessionDetails = await sessionHelper.generateAndStoreSession(req, ip, user._id);
        if (!sessionDetails) {
            return res.redirect('/login?error=session_failed');
        };

        req.session.user = { _id: user._id.toString(), authToken: sessionDetails?.authToken };

        await OTP.deleteMany({ email: cleanEmail });

        return req.session.save((saveErr) => {
            if (saveErr) {
                generalLib.log1([`[directLoginLink][SESSION_SAVE_FAIL] email=${cleanEmail}`, saveErr.message]);
                return res.redirect('/login?error=session_failed');
            };

            return res.redirect('/');
        });
    } catch (err) {
        generalLib.log1(["Error in directLoginLink----->", err]);
        return res.redirect('/login?error=direct_login_failed');
    };
};

const accountRecovery = async (req, res, next) => {
    try {
        const { recoveryPhrase } = req.body;

        if (!recoveryPhrase || typeof recoveryPhrase !== 'string' || !recoveryPhrase.trim()) {
            return res.status(constants.STATUS.BAD_REQUEST).json(generalLib.error_res("Please enter your 12-word recovery phrase."));
        };

        const cleanPhrase = recoveryPhrase.trim().toLowerCase();

        const wordCount = cleanPhrase.split(/\s+/).filter(w => w.length > 0).length;
        if (wordCount !== 12) {
            return res.status(constants.STATUS.BAD_REQUEST).json(generalLib.error_res(`Recovery phrase must be exactly 12 words. You entered ${wordCount} word(s).`));
        };

        const user = await User.findOne({
            recoveryPhrase: { $regex: new RegExp(`^${cleanPhrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
            status: constants.USER_STATUS.ACTIVE,
        });

        const successMsg = "If your recovery phrase is correct, a login link has been sent to your registered email address.";

        if (!user) {
            return res.status(constants.STATUS.OK).json(generalLib.success_res(successMsg));
        };

        const otpCode = generalLib.generateOtp(constants.OTP_LENGTH);
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

        const baseUrl = process.env.NODE_URL;
        const directLoginUrl = `${baseUrl}/auth/direct-login?token=${verificationToken}&email=${encodeURIComponent(user.email)}`;

        const mailFile = await ejs.renderFile("views/emails/recovery-login.ejs", {
            userName: user.fullName,
            directLoginUrl: directLoginUrl,
            expireIn: constants.DIRECT_URL_EXPIRY_MINUTE / (1000 * 60),
        });

        const mailOptions = {
            from: process.env.MAIL_FROM_ADDRESS || process.env.MAIL_USERNAME,
            to: user.email,
            subject: "Account Recovery — Your Solana System Login Link",
            html: mailFile,
        };

        const emailSent = await sendMail(mailOptions);
        if (!emailSent) {
            generalLib.log1([`[accountRecovery][MAIL_FAIL] email=${user.email}`]);
        } else {
            generalLib.log1([`[accountRecovery][MAIL_SENT] email=${user.email}`]);
        };

        return res.json(generalLib.success_res(successMsg));
    } catch (err) {
        generalLib.log1(["[accountRecovery][EXCEPTION]", err.message, err.stack]);
        return res.json(generalLib.error_res("Account recovery failed. Please try again."));
    };
};

const login = async (req, res, next) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(constants.STATUS.BAD_REQUEST).json(generalLib.error_res("Email is required."));
        };

        const cleanEmail = email.trim().toLowerCase();
        const user = await User.findOne({ email: cleanEmail });

        const otpExpires = new Date(Date.now() + constants.OTP_EXPIRY_MINUTE);
        const directUrlExpires = new Date(Date.now() + constants.DIRECT_URL_EXPIRY_MINUTE);

        if (!user) {
            return res.status(constants.STATUS.BAD_REQUEST).json(generalLib.error_res("No account found with this email address."));
        } else if (user.status === constants.USER_STATUS.INACTIVE) {
            await OTP.findOneAndUpdate({ email: cleanEmail },
                {
                    verificationOtpExpires: otpExpires,
                    directUrlExpires: directUrlExpires,
                },
                { new: true },
            );

            return res.status(constants.STATUS.BAD_REQUEST).json(generalLib.error_res("Your account is not verified. Please complete the verification process.", {
                unverified: true,
                redirectUrl: `/verify-otp?email=${encodeURIComponent(user.email)}`,
            }));
        } else if (user.status === constants.USER_STATUS.SUSPENDED) {
            return res.status(constants.STATUS.BAD_REQUEST).json(generalLib.error_res("Your account has been suspended. Please contact support."));
        };

        await OTP.deleteMany({ email: cleanEmail });

        const otpCode = generalLib.generateOtp(constants.OTP_LENGTH);
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

        const baseUrl = process.env.NODE_URL;
        const directLoginUrl = `${baseUrl}/auth/direct-login?token=${verificationToken}&email=${encodeURIComponent(user.email)}`;

        const mailFile = await ejs.renderFile("views/emails/otp-verification.ejs", {
            title: "Login OTP",
            userName: user.fullName,
            otpCode: otpCode,
            directLoginUrl: directLoginUrl,
            expireIn: constants.OTP_EXPIRY_MINUTE / (1000 * 60),
        });

        const mailOptions = {
            from: process.env.MAIL_FROM_ADDRESS || process.env.MAIL_USERNAME,
            to: user.email,
            subject: `${otpCode} is your Solana System verification code`,
            html: mailFile,
        };

        const emailSent = await sendMail(mailOptions);
        if (!emailSent) {
            return res.status(constants.STATUS.BAD_REQUEST).json(generalLib.error_res("Failed to send OTP email. Please try again."));
        };

        return res.status(constants.STATUS.OK).json(generalLib.success_res("OTP verification code has been sent to your email. Please verify OTP.", {
            email: user.email,
            redirectUrl: `/verify-otp?email=${encodeURIComponent(user.email)}`,
        }));
    } catch (err) {
        generalLib.log1(["Error in Login----->", err]);
        return res.status(constants.STATUS.INTERNAL_SERVER_ERROR).json(generalLib.error_res(messages.unexpectedDataError));
    };
};

const postVerify2FACode = async (req, res) => {
    try {
        const { email, twoFACode } = req.body ?? {};

        const validate = await customValidation((req.body ?? {}), "auth.verify2FACode");
        if (!validate.success) {
            return res.status(constants.STATUS.BAD_REQUEST).json(validate);
        };

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(constants.STATUS.BAD_REQUEST).json(generalLib.error_res("Invalid credentials."));
        };

        const ip = await generalLib.getIp(req);

        const decryptedTwoFASecret = await generalLib.decryptCipher(user.twoFASecret);

        const isCodeValid = await twoFactorAuthLib.verifyToken(decryptedTwoFASecret, twoFACode);
        if (!isCodeValid.success) {
            generalLib.log1(["postVerify2FACode: Invalid 2FA code for user ----->", email, "IP ----->", ip]);
            return res.status(constants.STATUS.BAD_REQUEST).json(generalLib.error_res("Invalid 2FA code."));
        };

        const sessionDetails = await sessionHelper.generateAndStoreSession(req, ip, user._id);
        if (!sessionDetails) {
            generalLib.log1(["postVerify2FACode: Failed to generate session for user ----->", email, "IP ----->", ip]);
            return res.status(constants.STATUS.INTERNAL_SERVER_ERROR).json(generalLib.error_res(messages.unexpectedDataError));
        };

        req.session.user = { _id: user._id.toString(), authToken: sessionDetails?.authToken };

        return res.status(constants.STATUS.OK).json(generalLib.success_res("Sign in successfully."));
    } catch (error) {
        errorLog(["Error in postVerify2FACode ----->", error]);
        return res.status(constants.STATUS.INTERNAL_SERVER_ERROR).json(generalLib.error_res(messages.unexpectedDataError));
    };
};

module.exports = {
    getLoginPage,
    getSignupPage,
    getVerifyOtpPage,
    signup,
    verifyOtp,
    directLoginLink,
    accountRecovery,
    login,
    postVerify2FACode,
};
