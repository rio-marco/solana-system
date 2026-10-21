import { ACTIVITY_STATUS } from './ui-constants.mjs';

const ACTIVITY_STATUS_CONFIG = {
    [ACTIVITY_STATUS.PENDING]: {
        label: 'PENDING',
        background: 'rgba(245,158,11,0.15)',
        color: '#F59E0B',
        border: 'rgba(245,158,11,0.3)',
    },
    [ACTIVITY_STATUS.VERIFIED]: {
        label: 'VERIFIED',
        background: 'rgba(20,241,149,0.15)',
        color: '#14F195',
        border: 'rgba(20,241,149,0.3)',
    },
    [ACTIVITY_STATUS.FAILED]: {
        label: 'FAILED',
        background: 'rgba(239,68,68,0.15)',
        color: '#ef4444',
        border: 'rgba(239,68,68,0.3)',
    },
};

export const ACTIVITY_STATUS_BADGE_STYLE = {
    padding: '0.2rem 0.5rem',
    borderRadius: '20px',
    fontSize: '0.68rem',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.4px',
    whiteSpace: 'nowrap',
};

export const getActivityStatus = (status) => {
    const statusCode = Number(status);
    const normalizedStatus = typeof status === 'string'
        ? status.trim().toUpperCase()
        : '';

    const config = Number.isInteger(statusCode) && status !== '' && status !== null
        ? ACTIVITY_STATUS_CONFIG[statusCode]
        : Object.values(ACTIVITY_STATUS_CONFIG).find(
            (item) => item.label === normalizedStatus
        );

    return config || {
        label: 'UNKNOWN',
        background: 'rgba(148,163,184,0.15)',
        color: '#94a3b8',
        border: 'rgba(148,163,184,0.3)',
    };
};