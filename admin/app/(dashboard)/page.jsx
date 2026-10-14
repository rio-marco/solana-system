'use client';

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useToast } from '../../context/ToastContext';
import { AdminWalletCard } from '../../components/AdminWalletCard';
import { AdminAnalytics } from '../../components/AdminAnalytics';
import { RefreshCw, Shield } from 'lucide-react';

export default function DashboardPage() {
    const { toastError, toastSuccess } = useToast();
    const [walletData, setWalletData] = useState(null);
    const [statsData, setStatsData] = useState(null);
    const [fetchingData, setFetchingData] = useState(true);

    const fetchAdminOverview = useCallback(async () => {
        setFetchingData(true);
        try {
            const [walletRes, statsRes] = await Promise.all([
                axios.get('/api/admin/wallet'),
                axios.get('/api/admin/stats'),
            ]);

            if (walletRes.data?.flag) {
                setWalletData(walletRes.data.data);
            };

            if (statsRes.data?.flag) {
                setStatsData(statsRes.data.data);
            };
        } catch (err) {
            console.error('Failed to fetch admin overview:', err);
            toastError('Failed to load admin overview data.');
        } finally {
            setFetchingData(false);
        };
    }, [toastError]);

    useEffect(() => {
        fetchAdminOverview();
    }, [fetchAdminOverview]);

    const handleGenerateWallet = async () => {
        try {
            const res = await axios.post('/api/admin/wallet/generate');
            if (res.data?.flag && res.data?.data) {
                toastSuccess('New Admin Wallet Address generated successfully!');
                setWalletData(res.data.data);
                fetchAdminOverview();
            } else {
                toastError(res.data?.message || 'Failed to generate new wallet address.');
            };
        } catch (err) {
            toastError(err.response?.data?.message || err.message || 'Error generating wallet address.');
        };
    };

    return (
        <div>
            {/* Header */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '1.75rem',
                    flexWrap: 'wrap',
                    gap: '1rem',
                    padding: '1rem 0 0.5rem',
                }}
            >
                <div>
                    <h1 style={{ color: '#212529', fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Dashboard Overview</h1>
                </div>
                <button
                    type="button"
                    onClick={fetchAdminOverview}
                    disabled={fetchingData}
                    style={{ background: '#FFFFFF', border: '1px solid #DEE2E6', color: '#212529', padding: '0.6rem 1.25rem', borderRadius: '6px', cursor: fetchingData ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: 600 }}
                >
                    <RefreshCw size={15} className={fetchingData ? 'animate-spin' : ''} /> Refresh
                </button>
            </div>

            {/* Wallet Card */}
            <div style={{ marginBottom: '1.75rem' }}>
                <AdminWalletCard
                    walletData={walletData}
                    onRefresh={fetchAdminOverview}
                    onGenerateWallet={handleGenerateWallet}
                    generating={false}
                />
            </div>

            {/* Analytics */}
            <AdminAnalytics statsData={statsData} />
        </div>
    );
};
