const bcrypt = require('bcryptjs');
const constants = require('../../../../lib/constants');
const messages = require('../../../../lib/messages');
const Admin = require('../../../../lib/models/admin.model');
const { createSessionRecord } = require('../../../../lib/session');
const { errorResponse, successResponse, log1 } = require("../../../../lib/general");

async function POST(req) {
    try {
        const body = await req.json();
        const { email, password } = body;

        if (!email || !email.trim() || !(constants.EMAIL_REGEX).test(email.trim())) {
            return errorResponse("Invalid email address.");
        };

        if (!password || !password.trim()) {
            return errorResponse("Password is required.");
        };

        const cleanEmail = email.trim().toLowerCase();
        const cleanPassword = password.trim();

        const admin = await Admin.findOne({ email: cleanEmail }).lean();

        if (!admin) {
            return errorResponse("Invalid email address or password. Please try again.");
        };

        const isMatch = await bcrypt.compare(cleanPassword, admin.password);
        if (!isMatch) {
            return errorResponse("Invalid email address or password. Please try again.");
        };

        const adminAgent = req.headers.get('user-agent') || 'Web-Browser';
        const { authToken } = await createSessionRecord(admin._id, adminAgent);

        const response = successResponse("Admin login successful!", {
            admin: {
                _id: admin._id,
                email: admin.email,
                name: admin.name,
            },
            authToken,
        });

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
        log1(['Error in login API route:', error.message]);
        return errorResponse(messages.unexpectedDataError);
    };
};

module.exports = { POST };