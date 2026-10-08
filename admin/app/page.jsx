'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Navbar } from '../components/Navbar';
import { AdminWalletCard } from '../components/AdminWalletCard';
import { AdminAnalytics } from '../components/AdminAnalytics';
import { AdminTransactionTable } from '../components/AdminTransactionTable';
import { Shield, RefreshCw } from 'lucide-react';

export default function AdminDashboardPage() {
    const { admin, loading } = useAuth();
    const router = useRouter();
    const { addToast } = useToast();

    const [walletData, setWalletData] = useState(null);
    const [statsData, setStatsData] = useState(null);
    const [fetchingData, setFetchingData] = useState(true);
    const [generatingWallet, setGeneratingWallet] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    useEffect(() => {
        if (!loading && !admin) {
            router.push('/login');
        };
    }, [admin, loading, router]);

    const fetchAdminOverview = useCallback(async () => {
        setFetchingData(true);
        try {
            const [walletRes, statsRes] = await Promise.all([
                axios.get('/api/admin/wallet'),
                axios.get('/api/admin/stats'),
            ]);

            if (walletRes.data && walletRes.data.flag) {
                setWalletData(walletRes.data.data);
            };

            if (statsRes.data && statsRes.data.flag) {
                setStatsData(statsRes.data.data);
            };
        } catch (err) {
            console.error('Failed to fetch admin overview:', err);
            addToast('Failed to load admin overview data.', 'error');
        } finally {
            setFetchingData(false);
        };
    }, [addToast]);

    useEffect(() => {
        if (admin) {
            fetchAdminOverview();
        };
    }, [admin, fetchAdminOverview]);

    const handleGenerateWallet = async () => {
        setGeneratingWallet(true);
        try {
            const res = await axios.post('/api/admin/wallet/generate');
            if (res.data && res.data.flag && res.data.data) {
                addToast('New Admin Wallet Address generated successfully!', 'success');
                setWalletData(res.data.data);
                setRefreshTrigger((prev) => prev + 1);
                fetchAdminOverview();
            } else {
                addToast(res.data?.message || 'Failed to generate new wallet address.', 'error');
            };
        } catch (err) {
            addToast(err.response?.data?.message || err.message || 'Error generating wallet address.', 'error');
        } finally {
            setGeneratingWallet(false);
        };
    };

    if (loading || !admin) {
        return (
            <div className="min-h-screen bg-dark flex flex-col items-center justify-center text-purple-400 gap-3 font-mono text-sm">
                <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
                <span>Loading Admin Panel...</span>
            </div>
        );
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-dark)' }}>
            <Navbar />

            <main className="dashboard-container" style={{ flex: 1, width: '100%', maxWidth: '1500px', margin: '0 auto', padding: '2rem 1rem' }}>
                {/* Header Title Bar */}
                <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#ef4444', fontSize: '0.9rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            <Shield size={18} />
                            <span>System Administration</span>
                        </div>
                        <h1 style={{ color: '#ffffff', fontSize: '1.85rem', fontWeight: 900, margin: '0.2rem 0 0 0' }}>
                            Admin Solana Treasury & All-Users Management
                        </h1>
                    </div>

                    <button
                        type="button"
                        onClick={fetchAdminOverview}
                        disabled={fetchingData}
                        style={{
                            background: 'rgba(255, 255, 255, 0.06)',
                            border: '1px solid rgba(255, 255, 255, 0.12)',
                            color: '#ffffff',
                            padding: '0.6rem 1.25rem',
                            borderRadius: '12px',
                            cursor: fetchingData ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            fontSize: '0.88rem',
                            fontWeight: 700,
                        }}
                    >
                        <RefreshCw size={16} className={fetchingData ? 'animate-spin' : ''} />
                        <span>Refresh Overview</span>
                    </button>
                </div>

                {/* Section 1: Generated Admin Wallet Address Card */}
                <div style={{ marginBottom: '2rem' }}>
                    <AdminWalletCard
                        walletData={walletData}
                        onRefresh={fetchAdminOverview}
                        onGenerateWallet={handleGenerateWallet}
                        generating={generatingWallet}
                    />
                </div>

                {/* Section 2: Financial Analysis & Metrics */}
                <div style={{ marginBottom: '2rem' }}>
                    <AdminAnalytics statsData={statsData} />
                </div>

                {/* Section 3: Paginated Deposit & Withdraw List Table for All Users */}
                <div>
                    <AdminTransactionTable refreshTrigger={refreshTrigger} />
                </div>
            </main>
        </div>
    );
};