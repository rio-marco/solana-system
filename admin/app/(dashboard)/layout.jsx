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
            <div style={{ minHeight: '100vh', background: '#F8F9FA', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ width: '44px', height: '44px', border: '4px solid rgba(13,110,253,0.3)', borderTop: '4px solid #0D6EFD', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                <span style={{ color: '#0D6EFD', fontWeight: 700, fontSize: '0.9rem', letterSpacing: '0.05em' }}>Loading Admin Panel...</span>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#F8F9FA' }}>
            {/* Sidebar */}
            <Sidebar />

            {/* Main Content */}
            <main
                style={{
                    flex: 1,
                    minWidth: 0,
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    padding: '1.5rem 1.5rem 2rem',
                    background: '#F8F9FA',
                }}
            >
                {children}
            </main>
        </div>
    );
};
