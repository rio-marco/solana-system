'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Wallet, ArrowDownLeft, ArrowUpRight, Megaphone, Tag, ShieldCheck, Hash } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { USER_STATUS } from './ui-constants.mjs';

export const DashboardOverview = () => {
    const { user, config } = useAuth();
    const router = useRouter();

    const balance = user?.btcrBalance !== undefined ? Number(user.btcrBalance).toFixed(8) : '0.00000000';

    const USER_STATUS_CONFIG = {
        [USER_STATUS.INACTIVE]: {
            text: 'Inactive',
            color: '#F59E0B',
        },
        [USER_STATUS.ACTIVE]: {
            text: 'Active',
            color: '#14F195',
        },
        [USER_STATUS.SUSPENDED]: {
            text: 'Suspended',
            color: '#ef4444',
        },
    };

    const { text: statusText, color: statusColor } = USER_STATUS_CONFIG[user?.status] || USER_STATUS_CONFIG[USER_STATUS.INACTIVE];

    const cardStyle = {
        background: 'rgba(15, 20, 34, 0.85)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '24px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
    };

    const quickActions = [
        { href: '/deposit', label: 'Deposit', icon: ArrowDownLeft, color: '#14F195' },
        { href: '/withdraw', label: 'Withdraw', icon: ArrowUpRight, color: '#00C2FF' },
        { href: '/campaign', label: 'Campaigns', icon: Megaphone, color: '#F59E0B' },
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Balance Hero */}
            <div style={{ ...cardStyle, padding: '2rem', background: 'linear-gradient(135deg, rgba(153,69,255,0.18) 0%, rgba(20,241,149,0.10) 100%), rgba(15, 20, 34, 0.85)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#94a3b8', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <Wallet size={16} style={{ color: '#14F195' }} />
                    <span>Current Balance</span>
                </div>
                <div className="font-mono" style={{ color: '#ffffff', fontSize: '2.6rem', fontWeight: 900, marginTop: '0.5rem', lineHeight: 1.1 }}>
                    {balance} <span style={{ fontSize: '1.2rem', color: '#14F195' }}>BTCR</span>
                </div>
                <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                    {quickActions.map((action) => {
                        const Icon = action.icon;
                        return (
                            <button
                                key={action.href}
                                type="button"
                                onClick={() => router.push(action.href)}
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', padding: '0.6rem 1.1rem', borderRadius: '12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#e2e8f0', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.2s ease' }}
                            >
                                <Icon size={16} style={{ color: action.color }} />
                                <span>{action.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Account Details */}
            <div style={{ ...cardStyle, padding: '1.75rem' }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff', margin: '0 0 1.25rem 0' }}>Account Details</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                    <DetailRow icon={Tag} label="Memo Tag" value={user?.memo || '-'} mono />
                    <DetailRow icon={Hash} label="Network" value={config?.network || 'devnet'} />
                    <DetailRow icon={ShieldCheck} label="Account Status" value={statusText} valueColor={statusColor} />
                    {/* <DetailRow icon={Wallet} label="Full Name" value={user?.fullName || '-'} /> */}
                </div>
            </div>
        </div>
    );
};

const DetailRow = ({ icon: Icon, label, value, mono, valueColor }) => {
    return (
        <div style={{ background: 'rgba(7, 9, 14, 0.6)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px', padding: '0.9rem 1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#64748b', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <Icon size={13} />
                <span>{label}</span>
            </div>
            <div className={mono ? 'font-mono' : ''} style={{ color: valueColor || '#ffffff', fontSize: '0.95rem', fontWeight: 700, marginTop: '0.35rem', wordBreak: 'break-word' }}>
                {value}
            </div>
        </div>
    );
};