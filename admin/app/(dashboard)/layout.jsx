'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { Sidebar } from '../../components/Sidebar';

export default function DashboardLayout({ children }) {
    const { admin, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !admin) {
            router.push('/login');
        }
    }, [admin, loading, router]);

    if (loading || !admin) {
        return (
            <div style={{ minHeight: '100vh', background: 'var(--bg-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ width: '44px', height: '44px', border: '4px solid rgba(153,69,255,0.3)', borderTop: '4px solid #9945FF', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                <span style={{ color: '#9945FF', fontWeight: 700, fontSize: '0.9rem', letterSpacing: '0.05em' }}>Loading Admin Panel...</span>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-dark)' }}>
            {/* Sidebar */}
            <Sidebar />

            {/* Main Content */}
            <main
                style={{
                    flex: 1,
                    minWidth: 0,
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    padding: '2rem 2rem 3rem',
                    maxHeight: '100vh',
                }}
            >
                {children}
            </main>
        </div>
    );
};
