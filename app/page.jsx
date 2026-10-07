'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { Navbar } from '../components/Navbar';
import { DepositSection } from '../components/DepositSection';
import { WithdrawSection } from '../components/WithdrawSection';
import { TransactionListTable } from '../components/TransactionListTable';
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';

export default function DashboardPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('deposit');
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        };
    }, [user, loading, router]);

    if (loading || !user) {
        return (
            <div className="min-h-screen bg-dark flex flex-col items-center justify-center text-purple-400 gap-3 font-mono text-sm">
                <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
                <span>Loading Solana Platform...</span>
            </div>
        );
    };

    const triggerRefresh = () => {
        setRefreshTrigger((prev) => prev + 1);
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-dark)' }}>
            <Navbar />

            <main className="dashboard-container" style={{ flex: 1, width: '100%', maxWidth: '1200px', margin: '0 auto', padding: '2rem 1rem' }}>
                {/* Solana Dashboard Tabs */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justify: 'center',
                        gap: '0.75rem',
                        marginBottom: '2rem',
                        background: 'rgba(15, 20, 34, 0.6)',
                        padding: '0.5rem',
                        borderRadius: '20px',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        width: 'fit-content',
                        margin: '0 auto 2rem auto',
                    }}
                >
                    <button
                        type="button"
                        onClick={() => setActiveTab('deposit')}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.6rem',
                            padding: '0.75rem 2.25rem',
                            borderRadius: '14px',
                            fontSize: '0.95rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                            background: activeTab === 'deposit' ? 'var(--solana-gradient)' : 'transparent',
                            color: activeTab === 'deposit' ? '#ffffff' : '#94a3b8',
                            border: 'none',
                            boxShadow: activeTab === 'deposit' ? '0 8px 24px rgba(153, 69, 255, 0.35)' : 'none',
                        }}
                    >
                        <ArrowDownLeft size={18} style={{ color: activeTab === 'deposit' ? '#14F195' : '#94a3b8' }} />
                        <span>1. Deposit</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('withdraw')}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.6rem',
                            padding: '0.75rem 2.25rem',
                            borderRadius: '14px',
                            fontSize: '0.95rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                            background: activeTab === 'withdraw' ? 'var(--solana-gradient)' : 'transparent',
                            color: activeTab === 'withdraw' ? '#ffffff' : '#94a3b8',
                            border: 'none',
                            boxShadow: activeTab === 'withdraw' ? '0 8px 24px rgba(153, 69, 255, 0.35)' : 'none',
                        }}
                    >
                        <ArrowUpRight size={18} style={{ color: activeTab === 'withdraw' ? '#14F195' : '#94a3b8' }} />
                        <span>2. Withdraw</span>
                    </button>
                </div>

                {/* Active Tab Content */}
                <div style={{ maxWidth: '680px', margin: '0 auto' }}>
                    {activeTab === 'deposit' ? (
                        <DepositSection onDepositSuccess={triggerRefresh} />
                    ) : (
                        <WithdrawSection onWithdrawSuccess={triggerRefresh} />
                    )}
                </div>

                {/* Tab-Aware History List: Deposit List when on Deposit tab, Withdraw List when on Withdraw tab */}
                <TransactionListTable type={activeTab} refreshTrigger={refreshTrigger} />
            </main>
        </div>
    );
};