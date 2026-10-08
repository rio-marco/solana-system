'use strict';

const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const constants = require('./constants');
const { log1, generateAuthToken, } = require('./general');
const User = require('./models/user.model');
const Session = require('./models/session.model');

const getAuthTokenFromReq = (req) => {
    let token = null;

    if (req.cookies && typeof req.cookies.get === 'function') {
        token = req.cookies.get('authToken')?.value || req.cookies.get(constants.PLATFORM_NAME)?.value;
    };

    if (!token && req.headers) {
        const authHeader = req.headers.get ? req.headers.get('authorization') : req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.substring(7);
        };

        if (!token) {
            const cookieHeader = req.headers.get ? req.headers.get('cookie') : req.headers.cookie;
            if (cookieHeader) {
                const match = cookieHeader.match(/authToken=([^;]+)/) || cookieHeader.match(new RegExp(`${constants.PLATFORM_NAME}=([^;]+)`));
                if (match) {
                    token = decodeURIComponent(match[1]);
                };
            };
        };
    };

    return token;
};

const verifySession = async (req) => {
    try {
        const authToken = getAuthTokenFromReq(req);
        if (!authToken) {
            return null;
        };

        let decoded;
        try {
            decoded = jwt.verify(authToken, process.env.AUTH_SECRET || 'AUTH_SECRET');
        } catch (e) {
            return null;
        };

        if (!decoded || !decoded._id) {
            return null;
        };

        const userId = decoded._id;
        const ua = req.headers.get ? req.headers.get('user-agent') : req.headers['user-agent'];

        const sessionQuery = {
            userId: new mongoose.Types.ObjectId(userId),
            authToken,
            status: constants.SESSION_STATUS.ACTIVE,
        };

        if (ua) {
            sessionQuery.ua = ua;
        };

        const userSession = await Session.findOne(sessionQuery).lean();
        if (!userSession) {
            return null;
        };

        const user = await User.findOne({
            _id: new mongoose.Types.ObjectId(userId),
            status: constants.USER_STATUS.ACTIVE,
        }).lean();

        if (!user) {
            return null;
        };

        return { user, userId, authToken };
    } catch (err) {
        log1(["Error in verifySession:", err.message]);
        return null;
    };
};

const createSessionRecord = async (userId, userAgent = '') => {
    try {
        const payload = {
            _id: userId.toString(),
            iat: Math.floor(Date.now() / 1000),
        };

        const authToken = await generateAuthToken(payload);

        const session = await Session.create({
            userId,
            authToken,
            ua: userAgent || 'Web-Browser',
            status: constants.SESSION_STATUS.ACTIVE,
        });

        return { authToken, session };
    } catch (error) {
        log1(["Error in createSessionRecord:", error.message]);
    };
};

module.exports = {
    verifySession,
    createSessionRecord,
    getAuthTokenFromReq,
};
