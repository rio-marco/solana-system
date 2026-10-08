const { NextResponse } = require('next/server');
const constants = require('../../../../lib/constants');
const Admin = require('../../../../lib/models/admin.model');
const OTP = require('../../../../lib/models/otp.model');
const { createSessionRecord } = require('../../../../lib/session');
const { log1 } = require("../../../../lib/general");

async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const email = searchParams.get('email');
        const token = searchParams.get('token');

        if (!email || !token) {
            return NextResponse.redirect(new URL('/login?error=invalid_direct_login', req.url));
        };

        const cleanEmail = email.trim().toLowerCase();
        const cleanToken = token.trim();

        const admin = await Admin.findOne({ email: cleanEmail });
        if (!admin) {
            return NextResponse.redirect(new URL('/login?error=admin_not_found', req.url));
        };

        const otpRecord = await OTP.findOne({
            email: cleanEmail,
            verificationToken: cleanToken,
            directUrlExpires: { $gt: new Date() },
        });

        if (!otpRecord) {
            return NextResponse.redirect(new URL('/login?error=expired_direct_login', req.url));
        };

        await OTP.deleteOne({ _id: otpRecord._id });

        const adminAgent = req.headers.get('user-agent') || 'Web-Browser';
        const { authToken } = await createSessionRecord(admin._id, adminAgent);

        const response = NextResponse.redirect(new URL('/', req.url));

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
        log1(['Error in direct-login API route:', error.message]);
        return NextResponse.redirect(new URL('/login?error=direct_login_failed', req.url));
    };
};

const dynamic = 'force-dynamic';

module.exports = { dynamic, GET };