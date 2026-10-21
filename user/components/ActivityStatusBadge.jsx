'use client';

import React from 'react';
import { getActivityStatus, ACTIVITY_STATUS_BADGE_STYLE } from './activity-status.mjs';

export const ActivityStatusBadge = ({ status }) => {
    if (status === null || status === undefined || status === '') return null;

    const { label, background, color, border } = getActivityStatus(status);

    return (
        <span
            style={{
                ...ACTIVITY_STATUS_BADGE_STYLE,
                background,
                color,
                border: `1px solid ${border}`,
            }}
        >
            {label}
        </span>
    );
};