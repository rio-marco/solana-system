'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { Navbar } from '../components/Navbar';
import { Sidebar } from '../components/Sidebar';
import { DashboardOverview } from '../components/DashboardOverview';
import { DepositSection } from '../components/DepositSection';
import { WithdrawSection } from '../components/WithdrawSection';
import { CampaignList } from '../components/CampaignList';
import { TransactionListTable } from '../components/TransactionListTable';

export default function UserDashboardPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('dashboard');

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        };
    }, [user, loading, router]);

    if (loading || !user) {
        return (
            <div className="min-h-screen bg-dark flex flex-col items-center justify-center text-purple-400 gap-3 font-mono text-sm">
                <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
                <span>Loading User Panel...</span>
            </div>
        );
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-dark)' }}>
            <Navbar />

            <div className="user-dashboard-shell">
                <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

                <main className="user-content">
                    {activeTab === 'dashboard' && (
                        <DashboardOverview onNavigate={setActiveTab} />
                    )}

                    {activeTab === 'deposit' && (
                        <div className="deposit-withdraw-split">
                            <DepositSection />
                            <TransactionListTable type="deposit" />
                        </div>
                    )}

                    {activeTab === 'withdraw' && (
                        <div className="deposit-withdraw-split">
                            <WithdrawSection />
                            <TransactionListTable type="withdraw" />
                        </div>
                    )}

                    {activeTab === 'campaign' && (
                        <CampaignList />
                    )}
                </main>
            </div>
        </div>
    );
};