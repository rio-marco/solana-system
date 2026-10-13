'use strict';

const messages = require('../../../../../lib/messages');
const constants = require('../../../../../lib/constants');
const { verifySession } = require('../../../../../lib/session');
const { errorResponse, successResponse, authErrorResponse, log1 } = require('../../../../../lib/general');
const customValidation = require("../../../../../lib/validator");
const Admin = require('../../../../../lib/models/admin.model');
const Session = require('../../../../../lib/models/session.model');

async function PATCH(req) {
    try {
        const sessionAuth = await verifySession(req);
        if (!sessionAuth || !sessionAuth.adminId) {
            return authErrorResponse(messages.unauthorizedAccess);
        };

        const body = await req.json();
        const { currentPassword, newPassword, confirmPassword } = body;

        const validation = await customValidation(body, "admin.change_password");
        if (validation.flag === 0) {
            return errorResponse(validation.msg || "Validation error");
        } else if (newPassword.length < 6) {
            return errorResponse('New password must be at least 6 characters long.');
        } else if (currentPassword === newPassword) {
            return errorResponse('New password cannot be the same as current password.');
        } else if (newPassword !== confirmPassword) {
            return errorResponse('New password and confirm password do not match.');
        };

        const admin = await Admin.findById(sessionAuth.adminId);
        if (!admin) {
            return errorResponse('Admin account not found.');
        };

        const isMatch = await admin.comparePassword(currentPassword);
        if (!isMatch) {
            return errorResponse('Current password is incorrect.');
        };

        const hashedPassword = await Admin.hashPassword(newPassword);
        admin.password = hashedPassword;
        await admin.save();

        await Session.updateOne(
            { userId: sessionAuth.adminId, authToken: sessionAuth.authToken },
            { status: constants.SESSION_STATUS.EXPIRED }
        );

        const response = successResponse("Password updated successfully.");

        response.cookies.delete('authToken');
        response.cookies.delete(constants.PLATFORM_NAME);

        return response;
    } catch (error) {
        log1(['Error in admin change password PATCH:', error.message]);
        return errorResponse(messages.unexpectedDataError);
    };
};

const dynamic = 'force-dynamic';
module.exports = { dynamic, PATCH };