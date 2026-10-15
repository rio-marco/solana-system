'use strict';

const mongoose = require('mongoose');
const messages = require('../../../../../lib/messages');
const { verifySession } = require('../../../../../lib/session');
const { errorResponse, successResponse, authErrorResponse, log1, buildProfilePhotoUrl } = require('../../../../../lib/general');
const { parseManagerInput } = require('../../../../../lib/manager-input');
const { saveImage, deleteImage } = require('../../../../../lib/upload');
const Manager = require('../../../../../lib/models/manager.model');

async function GET(req, { params }) {
    try {
        const sessionAuth = await verifySession(req);
        if (!sessionAuth || !sessionAuth.adminId) {
            return authErrorResponse(messages.unauthorizedAccess);
        };

        const managerId = params?.id;

        if (!managerId || !mongoose.isValidObjectId(managerId)) {
            return errorResponse('Invalid manager ID.');
        };

        const manager = await Manager.findById(managerId).select('-password').lean();

        if (!manager) {
            return errorResponse('Manager not found.');
        };

        return successResponse('Manager fetched successfully.', {
            manager: { ...manager, profilePhoto: buildProfilePhotoUrl(manager.profilePhoto) },
        });
    } catch (error) {
        log1(['Error in admin manager details GET:', error.message]);
        return errorResponse(messages.unexpectedDataError);
    };
};

async function PATCH(req, { params }) {
    try {
        const sessionAuth = await verifySession(req);
        if (!sessionAuth || !sessionAuth.adminId) {
            return authErrorResponse(messages.unauthorizedAccess);
        };

        const managerId = params?.id;

        if (!managerId || !mongoose.isValidObjectId(managerId)) {
            return errorResponse('Invalid manager ID.');
        };

        const manager = await Manager.findById(managerId);
        if (!manager) {
            return errorResponse('Manager not found.');
        };

        const contentType = req.headers.get('content-type') || '';
        let body;
        let file;

        if (contentType.includes('multipart/form-data') || contentType.includes('application/x-www-form-urlencoded')) {
            const formData = await req.formData();
            body = {
                name: formData.get('name'),
                email: formData.get('email'),
                countryCode: formData.get('countryCode'),
                phoneNumber: formData.get('phoneNumber'),
                status: formData.get('status'),
            };
            file = formData.get('profilePhoto');

            if (file && typeof file === 'object' && !file.name) {
                file = null;
            };
        } else {
            body = await req.json();
        };

        const { error, data } = parseManagerInput(body, { partial: true });
        if (error) {
            return errorResponse(error);
        };

        if (data.email && data.email !== manager.email) {
            const existing = await Manager.findOne({ email: data.email, _id: { $ne: managerId } }).lean();
            if (existing) {
                return errorResponse('A manager with this email already exists.');
            };
        };

        const updateData = { ...data };

        if (file) {
            const saved = await saveImage(file, { subdir: 'managers', prefix: 'manager' });
            if (saved.error) {
                return errorResponse(saved.error);
            };

            const oldPhoto = manager.profilePhoto;
            updateData.profilePhoto = saved.path;

            try {
                await Manager.findByIdAndUpdate(managerId, updateData, { new: true });
            } catch (updateErr) {
                deleteImage(saved.path);
                throw updateErr;
            };

            if (oldPhoto) deleteImage(oldPhoto);

            const updated = await Manager.findById(managerId).select('-password').lean();

            return successResponse('Manager updated successfully.', {
                manager: { ...updated, profilePhoto: buildProfilePhotoUrl(updated.profilePhoto) },
            });
        };

        if (Object.keys(updateData).length === 0) {
            return errorResponse('No changes provided.');
        };

        const updated = await Manager.findByIdAndUpdate(managerId, updateData, { new: true }).select('-password').lean();

        return successResponse('Manager updated successfully.', {
            manager: { ...updated, profilePhoto: buildProfilePhotoUrl(updated.profilePhoto) },
        });
    } catch (error) {
        log1(['Error in admin manager details PATCH:', error.message]);
        return errorResponse(messages.unexpectedDataError);
    };
};

async function DELETE(req, { params }) {
    try {
        const sessionAuth = await verifySession(req);
        if (!sessionAuth || !sessionAuth.adminId) {
            return authErrorResponse(messages.unauthorizedAccess);
        };

        const managerId = params?.id;

        if (!managerId || !mongoose.isValidObjectId(managerId)) {
            return errorResponse('Invalid manager ID.');
        };

        const manager = await Manager.findByIdAndDelete(managerId);

        if (!manager) {
            return errorResponse('Manager not found.');
        };

        if (manager.profilePhoto) deleteImage(manager.profilePhoto);

        return successResponse('Manager deleted successfully.', { manager: { _id: manager._id } });
    } catch (error) {
        log1(['Error in admin manager details DELETE:', error.message]);
        return errorResponse(messages.unexpectedDataError);
    };
};

const dynamic = 'force-dynamic';
module.exports = { dynamic, GET, PATCH, DELETE };