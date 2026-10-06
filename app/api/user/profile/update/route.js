const path = require('path');
const fs = require('fs');
const constants = require('../../../../../lib/constants');
const messages = require('../../../../../lib/messages');
const User = require('../../../../../lib/models/user.model');
const { verifySession } = require('../../../../../lib/session');
const { errorResponse, successResponse, authErrorResponse, log1 } = require("../../../../../lib/general");

async function POST(req) {
    try {
        const sessionAuth = await verifySession(req);
        if (!sessionAuth || !sessionAuth.userId) {
            return authErrorResponse(messages.unauthorizedAccess);
        }

        const userId = sessionAuth.userId;
        const formData = await req.formData();
        const fullName = formData.get('fullName');
        const file = formData.get('profilePhoto');

        if (!fullName || !fullName.toString().trim()) {
            return errorResponse("Full name is required.");
        };

        const cleanFullName = fullName.toString().trim();
        if (!(constants.FULL_NAME_REGEX).test(cleanFullName)) {
            return errorResponse("Full name must be 2–60 characters and contain only letters and spaces.");
        };

        const updateData = {
            fullName: cleanFullName,
        };

        if (file && typeof file === 'object' && file.name) {
            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);

            const ext = path.extname(file.name).toLowerCase() || '.jpg';
            const allowedTypes = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
            if (!allowedTypes.includes(ext)) {
                return errorResponse("Only image files are allowed (jpg, png, webp, gif).");
            };

            const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'profiles');
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            };

            const uniqueName = `profile_${userId}_${Date.now()}${ext}`;
            const filePath = path.join(uploadDir, uniqueName);

            const existingUser = await User.findById(userId).lean();
            if (existingUser && existingUser.profilePhoto) {
                const oldPath = path.join(process.cwd(), 'public', existingUser.profilePhoto);
                if (fs.existsSync(oldPath)) {
                    try { fs.unlinkSync(oldPath); } catch (e) { }
                };
            };

            await fs.promises.writeFile(filePath, buffer);
            updateData.profilePhoto = `uploads/profiles/${uniqueName}`;
        };

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            updateData,
            { new: true, select: '-recoveryPhrase' }
        ).lean();

        if (!updatedUser) {
            return errorResponse("User not found.");
        };

        return successResponse("Profile updated successfully.",
            {
                user: {
                    fullName: updatedUser.fullName,
                    email: updatedUser.email,
                    profilePhoto: updatedUser.profilePhoto || "",
                    memo: updatedUser.memo,
                    walletBalance: updatedUser.walletBalance,
                },
            },
        );
    } catch (error) {
        log1(['Error in profile update API route:', error.message]);
        return errorResponse(messages.unexpectedDataError);
    };
};

module.exports = { POST };