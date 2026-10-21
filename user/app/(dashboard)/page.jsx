'use client';

import React from 'react';
import { DashboardOverview } from '../../components/DashboardOverview';

export default function DashboardPage() {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <DashboardOverview />
        </div>
    );
};