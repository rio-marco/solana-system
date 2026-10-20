'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Wallet, ArrowDownLeft, ArrowUpRight, Megaphone, Tag, ShieldCheck, Check, Copy, Hash, Banknote } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { copyTextToClipboard } from '../lib/clipboard';
import { USER_STATUS, WALLET_NETWORK } from './ui-constants.mjs';

export const DashboardOverview = () => {
    const { user, config } = useAuth();
    const router = useRouter();
    const [copiedMemo, setCopiedMemo] = useState(false);

    const memo = user?.memo || '';

    const balance = user?.btcrBalance !== undefined ? Number(user.btcrBalance).toFixed(8) : '0.00000000';
    const availableWithdrawBalance = user?.availableWithdrawBalance !== undefined ? Number(user.availableWithdrawBalance).toFixed(8) : '0.00000000';

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

    const copyMemo = async () => {
        if (!memo) return;
        const ok = await copyTextToClipboard(memo);
        if (ok) {
            setCopiedMemo(true);
            setTimeout(() => setCopiedMemo(false), 2000);
        };
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Balance Hero */}
            <div style={{ ...cardStyle, padding: '2rem', background: 'linear-gradient(135deg, rgba(153,69,255,0.18) 0%, rgba(20,241,149,0.10) 100%), rgba(15, 20, 34, 0.85)' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5rem', marginTop: '0.5rem' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#94a3b8', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            <Wallet size={16} style={{ color: '#14F195' }} />
                            <span>Current Balance</span>
                        </div>
                        <div className="font-mono" style={{ color: '#14F195', fontSize: '2.6rem', fontWeight: 900, marginTop: '0.5rem', lineHeight: 1.1 }}>
                            {balance} <span style={{ fontSize: '1.2rem', color: '#14F195' }}>BTCR</span>
                        </div>
                    </div>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#94a3b8', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            <Banknote size={16} style={{ color: '#00C2FF' }} />
                            <span>Available Withdraw Balance</span>
                        </div>
                        <div className="font-mono" style={{ color: '#00C2FF', fontSize: '2.6rem', fontWeight: 900, marginTop: '0.5rem', lineHeight: 1.1 }}>
                            {availableWithdrawBalance} <span style={{ fontSize: '1.2rem', color: '#00C2FF' }}>BTCR</span>
                        </div>
                    </div>
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
                <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff', margin: '0 0 1.25rem 0' }}>
                    Account Details
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                    {/* Memo Tag */}
                    <div
                        style={{
                            background: 'rgba(7, 9, 14, 0.6)',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            borderRadius: '16px',
                            padding: '0.9rem 1rem',
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#64748b', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            <Tag size={13} />
                            <span>Memo Tag</span>
                        </div>
                        <div
                            style={{
                                position: 'relative',
                                display: 'flex',
                                alignItems: 'center',
                            }}
                        >
                            <div className='font-mono' style={{ color: '#ffffff', fontSize: '0.95rem', fontWeight: 700, marginTop: '0.35rem', wordBreak: 'break-word' }}>
                                {memo}
                            </div>
                            <button
                                type="button"
                                onClick={copyMemo}
                                disabled={!memo}
                                className={`input-inline-copy${copiedMemo ? ' copied' : ''}`}
                            >
                                {copiedMemo ? <Check size={14} /> : <Copy size={14} />}
                                <span>{copiedMemo ? 'Copied' : 'Copy'}</span>
                            </button>
                        </div>
                    </div>

                    {/* Network */}
                    <div
                        style={{
                            background: 'rgba(7, 9, 14, 0.6)',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            borderRadius: '16px',
                            padding: '0.9rem 1rem',
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#64748b', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            <Hash size={13} />
                            <span>Network</span>
                        </div>
                        <div style={{ color: '#ffffff', fontSize: '0.95rem', fontWeight: 700, marginTop: '0.35rem', wordBreak: 'break-word' }}>
                            {config?.network || WALLET_NETWORK.DEVNET}
                        </div>
                    </div>

                    {/* Account Status */}
                    <div
                        style={{
                            background: 'rgba(7, 9, 14, 0.6)',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            borderRadius: '16px',
                            padding: '0.9rem 1rem',
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#64748b', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            <ShieldCheck size={13} />
                            <span>Account Status</span>
                        </div>
                        <div style={{ color: statusColor || '#ffffff', fontSize: '0.95rem', fontWeight: 700, marginTop: '0.35rem', wordBreak: 'break-word' }}>
                            {statusText}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};