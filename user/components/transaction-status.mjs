import { TRANSACTION_STATUS } from './ui-constants.mjs';

const TRANSACTION_STATUS_CONFIG = {
    [TRANSACTION_STATUS.PENDING]: {
        label: 'PENDING',
        background: 'rgba(245,158,11,0.15)',
        color: '#F59E0B',
        border: 'rgba(245,158,11,0.3)',
    },
    [TRANSACTION_STATUS.PROCESSING]: {
        label: 'PROCESSING',
        background: 'rgba(245,158,11,0.15)',
        color: '#F59E0B',
        border: 'rgba(245,158,11,0.3)',
    },
    [TRANSACTION_STATUS.CONFIRMED]: {
        label: 'CONFIRMED',
        background: 'rgba(20,241,149,0.15)',
        color: '#14F195',
        border: 'rgba(20,241,149,0.3)',
    },
    [TRANSACTION_STATUS.FAILED]: {
        label: 'FAILED',
        background: 'rgba(239,68,68,0.15)',
        color: '#ef4444',
        border: 'rgba(239,68,68,0.3)',
    },
};

export const getTransactionStatus = (status) => {
    const statusCode = Number(status);
    const normalizedStatus = typeof status === 'string'
        ? status.trim().toUpperCase()
        : '';

    const config = Number.isInteger(statusCode) && status !== '' && status !== null
        ? TRANSACTION_STATUS_CONFIG[statusCode]
        : Object.values(TRANSACTION_STATUS_CONFIG).find(
            (item) => item.label === normalizedStatus
        );

    return config || {
        label: 'UNKNOWN',
        background: 'rgba(148,163,184,0.15)',
        color: '#94a3b8',
        border: 'rgba(148,163,184,0.3)',
    };
};