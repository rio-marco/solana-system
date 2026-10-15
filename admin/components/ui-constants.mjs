/**
 * ui-constants.js — Client-safe constants (ES Module)
 * Placed in components/ so Next.js webpack treats it as ESM (not CJS).
 * Import this in React client components.
 */

export const DEFAULT_ITEM_PER_PAGE = 10;
export const DEFAULT_CURRENT_PAGE = 1;

export const USER_STATUS = {
    INACTIVE: 1,
    ACTIVE: 2,
    SUSPENDED: 3,
};

export const MANAGER_STATUS = {
    INACTIVE: 0,
    ACTIVE: 1,
    SUSPENDED: 2,
};

export const TWOFA_STATUS = {
    DISABLED: 0,
    ENABLED: 1,
};

export const TRX_TYPE = {
    DEPOSIT: 0,
    WITHDRAW: 1,
};

export const DEPOSIT_STATUS = {
    PENDING: 'PENDING',
    CONFIRMED: 'CONFIRMED',
    FAILED: 'FAILED',
};

export const WITHDRAW_STATUS = {
    PENDING: 'PENDING',
    CONFIRMED: 'CONFIRMED',
    FAILED: 'FAILED',
};

export const CAMPAIGN = {
    NAME_MIN_LENGTH: 2,
    NAME_MAX_LENGTH: 120,
    MAX_COMMENTS: 100,
    COMMENT_MAX_LENGTH: 500,
};

export const PHONE_REGEX = /^\+?[0-9][0-9\s\-()]{6,19}$/;
export const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[A-Za-z]{2,}$/;

export const MANAGER = {
    NAME_MIN_LENGTH: 2,
    NAME_MAX_LENGTH: 100,
    PASSWORD_LENGTH: 8,
};
