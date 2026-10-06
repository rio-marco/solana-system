'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { Navbar } from '../components/Navbar';
import { DepositSection } from '../components/DepositSection';
import { WithdrawSection } from '../components/WithdrawSection';
import { TransactionListTable } from '../components/TransactionListTable';

export default function DashboardPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
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

            <main className="dashboard-container" style={{ flex: 1, width: '100%' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '2rem' }}>
                    <div>
                        <DepositSection onDepositSuccess={triggerRefresh} />
                    </div>
                    <div>
                        <WithdrawSection onWithdrawSuccess={triggerRefresh} />
                    </div>
                </div>

                <TransactionListTable refreshTrigger={refreshTrigger} />
            </main>
        </div>
    );
};