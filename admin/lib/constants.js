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
    PHONE_REGEX: /^\+?[0-9][0-9\s\-()]{6,19}$/,
    COUNTRY_CODE_REGEX: /^\+\d{1,4}$/,
    PHONE_DIGITS_REGEX: /^\d{4,15}$/,
    DEFAULT_COUNTRY_CODE: '+1',
    DEFAULT_PHONE_LENGTH: { min: 6, max: 15 },

    CAMPAIGN: {
        NAME_MIN_LENGTH: 2,
        NAME_MAX_LENGTH: 120,
        MAX_COMMENTS: 100,
        COMMENT_MAX_LENGTH: 500,
    },

    MANAGER: {
        NAME_MIN_LENGTH: 2,
        NAME_MAX_LENGTH: 100,
        PASSWORD_LENGTH: 8,
    },

    OTP_TYPE: {
        SIGNUP: 1,
        LOGIN: 2,
    },

    TWOFA_STATUS: {
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

    MANAGER_STATUS: {
        INACTIVE: 0,
        ACTIVE: 1,
        SUSPENDED: 2,
    },

    SESSION_STATUS: {
        EXPIRED: 0,
        ACTIVE: 1,
    },

    TRX_TYPE: {
        CREDIT: 1,
        DEBIT: 2,
    },

    COIN: {
        SOL: 1,
        BTCR: 2,
    },

    TRANSACTION_STATUS: {
        PENDING: 1,
        PROCESSING: 2,
        CONFIRMED: 3,
        FAILED: 4,
    },

    ACTIVITY_STATUS: {
        PENDING: 0,
        VERIFIED: 1,
        FAILED: 2,
    },

    TRX_UNLOCKED_STATUS: {
        PENDING: 0,
        COMPLETE: 1,
    },

    NOTIFICATION_TYPE: {
        SYSTEM: 1,
        DEPOSIT: 2,
        WITHDRAWAL: 3,
    },

    WALLET_TYPE: {
        PLATFORM_DEPOSIT: 1,
        DEMO_SENDER: 2,
    },

    WALLET_NETWORK: {
        DEVNET: 'devnet',
        TESTNET: 'testnet',
        MAINNET_BETA: 'mainnet-beta',
    },

    COUNTRY_PHONE_LENGTHS: {
        '+1': { min: 10, max: 10 },
        '+7': { min: 10, max: 10 },
        '+20': { min: 10, max: 10 },
        '+27': { min: 9, max: 9 },
        '+30': { min: 10, max: 10 },
        '+31': { min: 9, max: 9 },
        '+32': { min: 9, max: 9 },
        '+33': { min: 9, max: 9 },
        '+34': { min: 9, max: 9 },
        '+36': { min: 9, max: 9 },
        '+39': { min: 9, max: 11 },
        '+40': { min: 9, max: 9 },
        '+41': { min: 9, max: 9 },
        '+43': { min: 4, max: 13 },
        '+44': { min: 10, max: 10 },
        '+45': { min: 8, max: 8 },
        '+46': { min: 9, max: 9 },
        '+47': { min: 8, max: 8 },
        '+48': { min: 9, max: 9 },
        '+49': { min: 5, max: 11 },
        '+51': { min: 9, max: 9 },
        '+52': { min: 10, max: 10 },
        '+54': { min: 10, max: 10 },
        '+55': { min: 10, max: 11 },
        '+56': { min: 9, max: 9 },
        '+57': { min: 10, max: 10 },
        '+58': { min: 10, max: 10 },
        '+60': { min: 9, max: 10 },
        '+61': { min: 9, max: 9 },
        '+62': { min: 9, max: 12 },
        '+63': { min: 10, max: 10 },
        '+64': { min: 8, max: 10 },
        '+65': { min: 8, max: 8 },
        '+66': { min: 9, max: 9 },
        '+81': { min: 10, max: 10 },
        '+82': { min: 9, max: 10 },
        '+84': { min: 9, max: 9 },
        '+86': { min: 11, max: 11 },
        '+90': { min: 10, max: 10 },
        '+91': { min: 10, max: 10 },
        '+92': { min: 10, max: 10 },
        '+93': { min: 9, max: 9 },
        '+94': { min: 9, max: 9 },
        '+95': { min: 8, max: 10 },
        '+98': { min: 10, max: 10 },
        '+212': { min: 9, max: 9 },
        '+213': { min: 9, max: 9 },
        '+233': { min: 9, max: 9 },
        '+234': { min: 10, max: 10 },
        '+254': { min: 9, max: 9 },
        '+263': { min: 9, max: 9 },
        '+351': { min: 9, max: 9 },
        '+352': { min: 9, max: 9 },
        '+353': { min: 9, max: 9 },
        '+354': { min: 7, max: 7 },
        '+355': { min: 9, max: 9 },
        '+356': { min: 8, max: 8 },
        '+357': { min: 8, max: 8 },
        '+358': { min: 5, max: 12 },
        '+359': { min: 9, max: 9 },
        '+370': { min: 8, max: 8 },
        '+371': { min: 8, max: 8 },
        '+372': { min: 8, max: 8 },
        '+373': { min: 8, max: 8 },
        '+374': { min: 8, max: 8 },
        '+375': { min: 9, max: 9 },
        '+380': { min: 9, max: 9 },
        '+381': { min: 9, max: 9 },
        '+385': { min: 9, max: 9 },
        '+386': { min: 8, max: 8 },
        '+420': { min: 9, max: 9 },
        '+421': { min: 9, max: 9 },
        '+507': { min: 8, max: 8 },
        '+852': { min: 8, max: 8 },
        '+880': { min: 10, max: 10 },
        '+886': { min: 9, max: 9 },
        '+960': { min: 7, max: 7 },
        '+961': { min: 7, max: 8 },
        '+962': { min: 9, max: 9 },
        '+964': { min: 10, max: 10 },
        '+965': { min: 8, max: 8 },
        '+966': { min: 9, max: 9 },
        '+967': { min: 9, max: 9 },
        '+968': { min: 8, max: 8 },
        '+970': { min: 9, max: 9 },
        '+971': { min: 9, max: 9 },
        '+972': { min: 9, max: 9 },
        '+973': { min: 8, max: 8 },
        '+974': { min: 8, max: 8 },
        '+976': { min: 8, max: 8 },
        '+977': { min: 10, max: 10 },
        '+994': { min: 9, max: 9 },
        '+995': { min: 9, max: 9 },
        '+998': { min: 9, max: 9 },
    },
};