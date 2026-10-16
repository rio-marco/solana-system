export const DEFAULT_ITEM_PER_PAGE = 10;
export const DEFAULT_CURRENT_PAGE = 1;

export const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[A-Za-z]{2,}$/;

export const USER_STATUS = {
    INACTIVE: 1,
    ACTIVE: 2,
    SUSPENDED: 3,
};

export const TWOFA_STATUS = {
    DISABLED: 0,
    ENABLED: 1,
};

export const TRX_TYPE = {
    CREDIT: 1,
    DEBIT: 2,
};

export const TRANSACTION_STATUS = {
    PENDING: 1,
    PROCESSING: 2,
    CONFIRMED: 3,
    FAILED: 4,
};

export const ACTIVITY_STATUS = {
    PENDING: 0,
    VERIFIED: 1,
    FAILED: 2,
};