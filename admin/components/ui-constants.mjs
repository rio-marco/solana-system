/**
 * ui-constants.js — Client-safe constants (ES Module)
 * Placed in components/ so Next.js webpack treats it as ESM (not CJS).
 * Import this in React client components.
 */

export const DEFAULT_ITEM_PER_PAGE = 10;
export const DEFAULT_CURRENT_PAGE  = 1;

export const USER_STATUS = {
    INACTIVE:  1,
    ACTIVE:    2,
    SUSPENDED: 3,
};

export const TwoFA_STATUS = {
    DISABLED: 0,
    ENABLED:  1,
};

export const DEPOSIT_STATUS = {
    PENDING:   'PENDING',
    CONFIRMED: 'CONFIRMED',
    FAILED:    'FAILED',
};

export const WITHDRAW_STATUS = {
    PENDING:   'PENDING',
    CONFIRMED: 'CONFIRMED',
    FAILED:    'FAILED',
};
