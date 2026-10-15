'use strict';

const messages = require('../../../../lib/messages');
const constants = require('../../../../lib/constants');
const { verifySession } = require('../../../../lib/session');
const { errorResponse, successResponse, authErrorResponse, log1, generatePassword, buildProfilePhotoUrl } = require('../../../../lib/general');
const { parseManagerInput } = require('../../../../lib/manager-input');
const { saveImage, deleteImage } = require('../../../../lib/upload');
const { sendMail } = require('../../../../lib/services/mail.service');
const Manager = require('../../../../lib/models/manager.model');

function escapeRegex(text) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

function buildCredentialsEmail(manager, plainPassword) {
    return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc; color: #0f172a; border-radius: 12px; border: 1px solid #e2e8f0;">
            <h2 style="color: #0D6EFD; margin-bottom: 20px;">Your Manager Account</h2>
            <p style="font-size: 16px; line-height: 1.5; color: #334155;">Hi <strong>${manager.name}</strong>,</p>
            <p style="font-size: 16px; line-height: 1.5; color: #334155;">A manager account has been created for you on ${constants.PLATFORM_NAME}. Below are your login credentials:</p>
            <div style="background-color: #ffffff; border: 1px solid #DEE2E6; border-radius: 8px; padding: 16px; margin: 20px 0;">
                <p style="margin: 0 0 8px; font-size: 15px; color: #334155;"><strong>Email:</strong> ${manager.email}</p>
                <p style="margin: 0; font-size: 15px; color: #334155;"><strong>Password:</strong> <span style="font-family: monospace; font-size: 18px; color: #0D6EFD; font-weight: bold;">${plainPassword}</span></p>
            </div>
            <p style="font-size: 14px; color: #64748b;">For security reasons, please keep these credentials confidential.</p>
        </div>
    `;
};

async function GET(req) {
    try {
        const sessionAuth = await verifySession(req);
        if (!sessionAuth || !sessionAuth.adminId) {
            return authErrorResponse(messages.unauthorizedAccess);
        };

        const { searchParams } = new URL(req.url);
        const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
        const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10', 10)));
        const skip = (page - 1) * limit;
        const search = (searchParams.get('search') || '').trim();
        const status = searchParams.get('status') || 'ALL';

        const query = {};

        if (search) {
            const safe = escapeRegex(search);
            query.$or = [
                { name: { $regex: safe, $options: 'i' } },
                { email: { $regex: safe, $options: 'i' } },
            ];
        };

        if (status && status !== 'ALL') {
            const statusNum = parseInt(status, 10);
            if (!isNaN(statusNum)) {
                query.status = statusNum;
            };
        };

        const [managers, totalCount] = await Promise.all([
            Manager.find(query).select('-password').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
            Manager.countDocuments(query),
        ]);

        const updatedManagers = managers.map((manager) => ({
            ...manager,
            profilePhoto: buildProfilePhotoUrl(manager.profilePhoto),
        }));

        const totalPages = Math.ceil(totalCount / limit);

        return successResponse('Managers fetched successfully.', {
            managers: updatedManagers,
            totalCount,
            totalPages,
            currentPage: page,
            limit,
        });
    } catch (error) {
        log1(['Error in admin managers GET:', error.message]);
        return errorResponse(messages.unexpectedDataError);
    };
};

async function POST(req) {
    try {
        const sessionAuth = await verifySession(req);
        if (!sessionAuth || !sessionAuth.adminId) {
            return authErrorResponse(messages.unauthorizedAccess);
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

        const { error, data } = parseManagerInput(body);
        if (error) {
            return errorResponse(error);
        };

        const existing = await Manager.findOne({ email: data.email }).lean();
        if (existing) {
            return errorResponse('A manager with this email already exists.');
        };

        let savedImagePath = '';

        if (file) {
            const saved = await saveImage(file, { subdir: 'managers', prefix: 'manager' });
            if (saved.error) {
                return errorResponse(saved.error);
            };
            savedImagePath = saved.path;
        };

        const plainPassword = generatePassword(constants.MANAGER.PASSWORD_LENGTH);
        const hashedPassword = await Manager.hashPassword(plainPassword);

        let created;
        try {
            created = await Manager.create({
                ...data,
                password: hashedPassword,
                profilePhoto: savedImagePath,
            });
        } catch (createErr) {
            if (savedImagePath) {
                deleteImage(savedImagePath);
            };

            if (createErr?.code === 11000) {
                return errorResponse('A manager with this email already exists.');
            };

            throw createErr;
        };

        sendMail({
            from: process.env.MAIL_FROM_ADDRESS || constants.SUPPORT_EMAIL,
            to: created.email,
            subject: 'Your Solana System Manager Credentials',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc; color: #0f172a; border-radius: 12px; border: 1px solid #e2e8f0;">
                    <h2 style="color: #0D6EFD; margin-bottom: 20px;">Your Manager Account</h2>
                    <p style="font-size: 16px; line-height: 1.5; color: #334155;">Hi <strong>${created.name}</strong>,</p>
                    <p style="font-size: 16px; line-height: 1.5; color: #334155;">A manager account has been created for you on ${constants.PLATFORM_NAME}. Below are your login credentials:</p>
                    <div style="background-color: #ffffff; border: 1px solid #DEE2E6; border-radius: 8px; padding: 16px; margin: 20px 0;">
                        <p style="margin: 0 0 8px; font-size: 15px; color: #334155;"><strong>Email:</strong> ${created.email}</p>
                        <p style="margin: 0; font-size: 15px; color: #334155;"><strong>Password:</strong> <span style="font-family: monospace; font-size: 18px; color: #0D6EFD; font-weight: bold;">${plainPassword}</span></p>
                    </div>
                    <p style="font-size: 14px; color: #64748b;">For security reasons, please keep these credentials confidential.</p>
                </div>
            `,
        }).catch((mailErr) => {
            log1(['[Managers] Failed to send email credentials:', mailErr.message]);
        });

        const manager = created.toObject();
        delete manager.password;
        manager.profilePhoto = buildProfilePhotoUrl(manager.profilePhoto);

        return successResponse('Manager created successfully.', { manager });
    } catch (error) {
        log1(['Error in admin managers POST:', error.message]);
        return errorResponse(messages.unexpectedDataError);
    };
};

const dynamic = 'force-dynamic';
module.exports = { dynamic, GET, POST };