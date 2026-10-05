const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const constants = require('../config/constant');
const generalLib = require('../utils/lib/general.lib');
const messages = require('../utils/messages');
const User = require('../models/user.model');
const Session = require('../models/session.model');

const { ObjectId } = mongoose.Types;

const getDashboardPage = (req, res) => {
    try {
        const user = req.user;

        return res.render("home", {
            header: {},
            body: {
                user: req.user,
                network: process.env.SOLANA_NETWORK || 'devnet',
                rpcUrl: process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com',
            },
            footer: {
                js: ["home.js"],
            },
        });
    } catch (error) {
        generalLib.log1(["Error in getDashboardPage----->", error]);
        return res.json(generalLib.error_res(messages.unexpectedDataError));
    };
};

const updateProfile = async (req, res) => {
    try {
        const userId = req.userId;
        const { fullName } = req.body;

        if (!fullName || !fullName.trim()) {
            return res.status(constants.STATUS.BAD_REQUEST).json(generalLib.error_res("Full name is required."));
        };

        if (!(constants.FULL_NAME_REGEX).test(fullName.trim())) {
            return res.status(constants.STATUS.BAD_REQUEST).json(generalLib.error_res("Full name must be 2–60 characters and contain only letters and spaces."));
        };

        const updateData = {
            fullName: fullName.trim(),
        };

        if (req.file) {
            const newPhotoPath = `uploads/profiles/${req.file.filename}`;

            const existingUser = await User.findById(userId).lean();
            if (existingUser && existingUser.profilePhoto) {
                const oldPath = path.join(__dirname, '..', 'public', existingUser.profilePhoto);
                if (fs.existsSync(oldPath)) {
                    fs.unlinkSync(oldPath);
                };
            };

            updateData.profilePhoto = newPhotoPath;
        };

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            updateData,
            { new: true, select: '-recoveryPhrase' }
        ).lean();

        if (!updatedUser) {
            return res.status(constants.STATUS.BAD_REQUEST).json(generalLib.error_res("User not found."));
        };

        return res.json(generalLib.success_res("Profile updated successfully.", {
            user: {
                fullName: updatedUser.fullName,
                email: updatedUser.email,
                profilePhoto: updatedUser.profilePhoto || "",
                memo: updatedUser.memo,
            },
        }));
    } catch (err) {
        generalLib.log1(["Error in updateProfile----->", error]);
        return res.status(constants.STATUS.INTERNAL_SERVER_ERROR).json(generalLib.error_res(messages.unexpectedDataError));
    };
};

const postSignOut = async (req, res) => {
    try {
        const userId = req.userId;
        const authToken = req.session?.user?.authToken;

        await Session.updateOne(
            { userId: new ObjectId(userId), authToken },
            { status: constants.SESSION_STATUS.EXPIRED }
        );

        req.session.destroy();

        return res.status(constants.STATUS.OK).json(generalLib.success_res("Sign out successfully."));
    } catch (error) {
        generalLib.log1(["Error in postSignOut----->", error]);
        return res.status(constants.STATUS.INTERNAL_SERVER_ERROR).json(generalLib.error_res(messages.unexpectedDataError));
    };
};

const getMe = async (req, res) => {
    try {
        const user = req.user;
        return res.json(generalLib.success_res("User fetched successfully", {
            user: {
                _id: user._id,
                email: user.email,
                fullName: user.fullName,
                profilePhoto: user.profilePhoto || "",
                memo: user.memo,
                is2FAEnabled: user.is2FAEnabled || false,
                depositWalletAddress: user.depositWalletAddress || "",
            },
            network: process.env.SOLANA_NETWORK || 'devnet',
            rpcUrl: process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com',
        }));
    } catch (error) {
        generalLib.log1(["Error in getMe----->", error]);
        return res.status(constants.STATUS.INTERNAL_SERVER_ERROR).json(generalLib.error_res(messages.unexpectedDataError));
    }
};

module.exports = {
    getDashboardPage,
    getMe,
    updateProfile,
    postSignOut,
};