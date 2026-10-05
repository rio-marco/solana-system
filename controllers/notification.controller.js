const Notification = require('../models/notification.model');
const generalLib = require('../utils/lib/general.lib');
const messages = require('../utils/messages');
const constants = require("../config/constant");

const getNotifications = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.max(1, parseInt(req.query.limit) || 10);
        const skip = (page - 1) * limit;

        const [notifications, total, unreadCount] = await Promise.all([
            Notification.find({ userId })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Notification.countDocuments({ userId }),
            Notification.countDocuments({ userId, isRead: false }),
        ]);

        const totalPages = Math.ceil(total / limit) || 1;

        const responsePayload = {
            notifications,
            pagination: {
                total,
                page,
                limit,
                totalPages,
                unreadCount,
            },
        };

        return res.status(constants.STATUS.OK).json(generalLib.success_res("Notification list get successfully!", responsePayload));
    } catch (err) {
        generalLib.log1(['[Get Notifications Error]:', err.message]);
        return res.status(constants.STATUS.INTERNAL_SERVER_ERROR).json(generalLib.error_res(messages.unexpectedDataError));
    }
};

const markAllAsRead = async (req, res, next) => {
    try {
        const userId = req.user._id;

        await Notification.updateMany({ userId, isRead: false }, { $set: { isRead: true } });

        return res.status(constants.STATUS.OK).json(generalLib.success_res("All notifications marked as read."));
    } catch (err) {
        generalLib.log1(['[Mark Read Notifications Error]:', err.message]);
        return res.status(constants.STATUS.INTERNAL_SERVER_ERROR).json(generalLib.error_res(messages.unexpectedDataError));
    }
};

module.exports = {
    getNotifications,
    markAllAsRead,
};
