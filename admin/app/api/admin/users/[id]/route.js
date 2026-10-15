'use strict';

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const messages = require('../../../../../lib/messages');
const constants = require('../../../../../lib/constants');
const { verifySession } = require('../../../../../lib/session');
const { errorResponse, successResponse, authErrorResponse, log1, buildProfilePhotoUrl } = require('../../../../../lib/general');
const User = require('../../../../../lib/models/user.model');

const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

async function GET(req, { params }) {
    try {
        const sessionAuth = await verifySession(req);
        if (!sessionAuth || !sessionAuth.adminId) {
            return authErrorResponse(messages.unauthorizedAccess);
        };

        const userId = params?.id;

        if (!userId || !mongoose.isValidObjectId(userId)) {
            return errorResponse('Invalid user ID.');
        };

        const user = await User.findById(userId).select('-twoFASecret -recoveryPhrase').lean();

        if (!user) {
            return errorResponse('User not found.');
        };

        const userData = { ...user, profilePhoto: buildProfilePhotoUrl(user.profilePhoto) };

        return successResponse('User details fetched successfully.', {
            user: userData,
        });
    } catch (error) {
        log1(['Error in admin user details GET:', error.message]);
        return errorResponse(messages.unexpectedDataError);
    };
};

async function PATCH(req, { params }) {
    try {
        const sessionAuth = await verifySession(req);
        if (!sessionAuth || !sessionAuth.adminId) {
            return authErrorResponse(messages.unauthorizedAccess);
        };

        const userId = params?.id;

        if (!userId || !mongoose.isValidObjectId(userId)) {
            return errorResponse('Invalid user ID.');
        };

        const user = await User.findById(userId);
        if (!user) {
            return errorResponse('User not found.');
        };

        const contentType = req.headers.get('content-type') || '';
        let fullName;
        // let twoFAStatusRaw;
        let file;

        if (contentType.includes('multipart/form-data') || contentType.includes('application/x-www-form-urlencoded')) {
            const formData = await req.formData();
            fullName = formData.get('fullName');
            // twoFAStatusRaw = formData.get('twoFAStatus');
            file = formData.get('profilePhoto');
        } else {
            const body = await req.json();
            fullName = body?.fullName;
            // twoFAStatusRaw = body?.twoFAStatus;
        };

        const updateData = {};

        if (fullName !== undefined && fullName !== null && String(fullName).trim() !== '') {
            const cleanName = String(fullName).trim();
            if (!constants.FULL_NAME_REGEX.test(cleanName)) {
                return errorResponse('Full name must be 2-60 characters and contain only letters and spaces.');
            };
            updateData.fullName = cleanName;
        };

        // if (twoFAStatusRaw !== undefined && twoFAStatusRaw !== null && String(twoFAStatusRaw).trim() !== '') {
        //     const twoFAStatus = Number(twoFAStatusRaw);
        //     if (!Object.values(constants.TWOFA_STATUS).includes(twoFAStatus)) {
        //         return errorResponse('Invalid 2FA status.');
        //     };

        //     if (twoFAStatus === constants.TWOFA_STATUS.ENABLED && !user.twoFASecret) {
        //         return errorResponse('Cannot enable 2FA because this user has not configured a 2FA secret yet.');
        //     };

        //     updateData.twoFAStatus = twoFAStatus;

        //     if (twoFAStatus === constants.TWOFA_STATUS.DISABLED) {
        //         updateData.twoFASecret = null;
        //     };
        // };

        if (file && typeof file === 'object' && file.name) {
            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);

            const ext = path.extname(file.name).toLowerCase() || '.jpg';
            if (!ALLOWED_IMAGE_EXTENSIONS.includes(ext)) {
                return errorResponse('Only image files are allowed (jpg, jpeg, png, webp, gif).');
            };

            const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'profiles');
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            };

            const uniqueName = `profile_${userId}_${Date.now()}${ext}`;
            await fs.promises.writeFile(path.join(uploadDir, uniqueName), buffer);

            const existingPhoto = (user.profilePhoto || '').trim();
            if (existingPhoto && !/^(https?:\/\/|data:)/i.test(existingPhoto)) {
                const oldPath = path.join(process.cwd(), 'public', existingPhoto.replace(/^\/+/, ''));
                if (fs.existsSync(oldPath)) {
                    try { fs.unlinkSync(oldPath); } catch (e) { };
                };
            };

            updateData.profilePhoto = `uploads/profiles/${uniqueName}`;
        };

        if (Object.keys(updateData).length === 0) {
            return errorResponse('No changes provided.');
        };

        const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true })
            .select('-twoFASecret -recoveryPhrase')
            .lean();

        return successResponse('User details updated successfully.', {
            user: { ...updatedUser, profilePhoto: buildProfilePhotoUrl(updatedUser.profilePhoto) },
        });
    } catch (error) {
        log1(['Error in admin user details PATCH:', error.message]);
        return errorResponse(messages.unexpectedDataError);
    };
};

const dynamic = 'force-dynamic';
module.exports = { dynamic, GET, PATCH };