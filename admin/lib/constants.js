require("dotenv").config();

module.exports = {
    PLATFORM_NAME: "solana-admin-system",
    SUPPORT_EMAIL: "support@solanasystem.com",
    CURRENT_TIMEZONE: process.env.TZ || "Asia/Kolkata",

    OTP_LENGTH: 6,

    OTP_EXPIRY_MINUTE: 1000 * 60 * 10,
    DIRECT_URL_EXPIRY_MINUTE: 1000 * 60 * parseInt(process.env.LOGIN_URL_EXPIRY_IN_MINUTE || '10', 10),
    REDIS_OTP_EXPIRY_SECOND: 900,

    DEFAULT_ITEM_PER_PAGE: 10,
    DEFAULT_CURRENT_PAGE: 1,

    BCRYPT_SALT: 10,

    SESSION_MAX_AGE: 1000 * 60 * 60 * 24 * 365 * 10,

    FULL_NAME_REGEX: /^[a-zA-Z\s]{2,60}$/,
    EMAIL_REGEX: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[A-Za-z]{2,}$/,

    OTP_TYPE: {
        SIGNUP: 1,
        LOGIN: 2,
    },

    TwoFA_STATUS: {
        DISABLED: 0,
        ENABLED: 1,
    },

    STATUS: {
        OK: 200,
        BAD_REQUEST: 400,
        UNAUTHORIZED: 401,
        NOT_FOUND: 404,
        INTERNAL_SERVER_ERROR: 500,
        MAINTENANCE_ERROR: 503,
    },

    USER_STATUS: {
        INACTIVE: 1,
        ACTIVE: 2,
        SUSPENDED: 3,
    },

    SESSION_STATUS: {
        EXPIRED: 0,
        ACTIVE: 1,
    },
};