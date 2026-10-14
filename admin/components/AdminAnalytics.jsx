'use client';

import React from 'react';
import { ArrowDownLeft, ArrowUpRight, DollarSign, Users, Activity, CheckCircle2, Clock, XCircle } from 'lucide-react';

export function AdminAnalytics({ statsData }) {
    if (!statsData) {
        return null;
    };

    const deposits = statsData.deposits || { confirmedAmount: 0, confirmedCount: 0, pendingCount: 0, failedCount: 0, totalCount: 0 };
    const withdrawals = statsData.withdrawals || { confirmedAmount: 0, confirmedCount: 0, pendingCount: 0, failedCount: 0, totalCount: 0 };
    const netVolume = statsData.netVolume || 0;
    const totalUsers = statsData.totalUsers || 0;

    const totalVolume = (deposits.confirmedAmount + withdrawals.confirmedAmount) || 1;
    const depositPct = Math.round((deposits.confirmedAmount / totalVolume) * 100);
    const withdrawPct = Math.round((withdrawals.confirmedAmount / totalVolume) * 100);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2rem' }}>
                {/* Top 4 Stat Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
                {/* Total Deposit Amount */}
                <div
                    style={{
                        background: '#FFFFFF',
                        borderRadius: '6px',
                        border: '1px solid #DEE2E6',
                        padding: '1.25rem 1.5rem',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                        <span style={{ color: '#6C757D', fontSize: '0.85rem', fontWeight: 600 }}>Total Deposit Amount</span>
                        <div style={{ background: '#E7F1FF', color: '#0D6EFD', padding: '0.4rem', borderRadius: '6px' }}>
                            <ArrowDownLeft size={20} />
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
                        <span style={{ fontSize: '1.75rem', fontWeight: 700, color: '#212529' }}>
                            {deposits.confirmedAmount.toFixed(8)}
                        </span>
                        <span style={{ color: '#6C757D', fontWeight: 700 }}>SOL</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem', fontSize: '0.78rem', color: '#6C757D' }}>
                        <span style={{ color: '#0D6EFD', fontWeight: 700 }}>{deposits.confirmedCount} Confirmed</span>
                        <span>•</span>
                        <span>{deposits.totalCount} Total Tx</span>
                    </div>
                </div>

                {/* Total Withdraw Amount */}
                <div
                    style={{
                        background: '#FFFFFF',
                        borderRadius: '6px',
                        border: '1px solid #DEE2E6',
                        padding: '1.25rem 1.5rem',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                        <span style={{ color: '#6C757D', fontSize: '0.85rem', fontWeight: 600 }}>Total Withdraw Amount</span>
                        <div style={{ background: '#E7F1FF', color: '#0D6EFD', padding: '0.4rem', borderRadius: '6px' }}>
                            <ArrowUpRight size={20} />
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
                        <span style={{ fontSize: '1.75rem', fontWeight: 700, color: '#212529' }}>
                            {withdrawals.confirmedAmount.toFixed(8)}
                        </span>
                        <span style={{ color: '#6C757D', fontWeight: 700 }}>SOL</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem', fontSize: '0.78rem', color: '#6C757D' }}>
                        <span style={{ color: '#0D6EFD', fontWeight: 700 }}>{withdrawals.confirmedCount} Confirmed</span>
                        <span>•</span>
                        <span>{withdrawals.totalCount} Total Tx</span>
                    </div>
                </div>

                {/* Net Volume / Balance */}
                {/* <div
                    style={{
                        background: '#FFFFFF',
                        borderRadius: '6px',
                        border: '1px solid rgba(56, 189, 248, 0.25)',
                        padding: '1.25rem 1.5rem',
                        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                        <span style={{ color: '#6C757D', fontSize: '0.85rem', fontWeight: 600 }}>Net Platform Transfer Volume</span>
                        <div style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', padding: '0.4rem', borderRadius: '10px' }}>
                            <DollarSign size={20} />
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
                        <span style={{ fontSize: '1.75rem', fontWeight: 900, color: netVolume >= 0 ? '#38bdf8' : '#ef4444' }}>
                            {netVolume >= 0 ? `+${netVolume.toFixed(8)}` : netVolume.toFixed(8)}
                        </span>
                        <span style={{ color: '#38bdf8', fontWeight: 800 }}>SOL</span>
                    </div>
                    <div style={{ marginTop: '0.5rem', fontSize: '0.78rem', color: '#6C757D' }}>
                        Deposits minus Withdrawals
                    </div>
                </div> */}

                {/* Total Users */}
                <div
                    style={{
                        background: '#FFFFFF',
                        borderRadius: '6px',
                        border: '1px solid #DEE2E6',
                        padding: '1.25rem 1.5rem',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                        <span style={{ color: '#6C757D', fontSize: '0.85rem', fontWeight: 600 }}>Total Users</span>
                        <div style={{ background: '#E7F1FF', color: '#0D6EFD', padding: '0.4rem', borderRadius: '6px' }}>
                            <Users size={20} />
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
                        <span style={{ fontSize: '1.75rem', fontWeight: 700, color: '#212529' }}>
                            {totalUsers}
                        </span>
                        <span style={{ color: '#6C757D', fontWeight: 700 }}>Users</span>
                    </div>
                    <div style={{ marginTop: '0.5rem', fontSize: '0.78rem', color: '#6C757D' }}>
                        Accounts on Platform
                    </div>
                </div>
            </div>

            {/* Analysis Ratio Bar & Status Details Grid */}
                    <div
                        style={{
                            background: '#FFFFFF',
                            borderRadius: '6px',
                            padding: '1rem 1.25rem',
                            border: '1px solid #DEE2E6',
                        }}
                    >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Activity size={18} style={{ color: '#0D6EFD' }} />
                        <h3 style={{ color: '#212529', fontSize: '1rem', fontWeight: 700, margin: 0 }}>
                            Deposit vs Withdrawal Volume Analysis
                        </h3>
                    </div>
                    <span style={{ color: '#6C757D', fontSize: '0.82rem', fontWeight: 600 }}>
                        {depositPct}% Deposit / {withdrawPct}% Withdraw
                    </span>
                </div>

                {/* Progress Bar */}
                <div style={{ height: '10px', background: '#F1F3F5', borderRadius: '5px', overflow: 'hidden', display: 'flex', marginBottom: '1.5rem' }}>
                    <div style={{ width: `${depositPct}%`, background: '#198754', transition: 'width 0.5s ease' }} title={`Deposit: ${depositPct}%`} />
                    <div style={{ width: `${withdrawPct}%`, background: '#0D6EFD', transition: 'width 0.5s ease' }} title={`Withdrawal: ${withdrawPct}%`} />
                </div>

                {/* Detailed Breakdown for Deposits and Withdrawals */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
                    {/* Deposit Breakdown */}
                    <div
                        style={{
                            background: '#FFFFFF',
                            borderRadius: '14px',
                            padding: '1rem 1.25rem',
                            border: '1px solid #DEE2E6',
                        }}
                    >
                        <h4 style={{ color: '#212529', fontSize: '0.9rem', fontWeight: 600, margin: '0 0 0.75rem 0', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <ArrowDownLeft size={16} />
                            <span>Deposit Status Distribution</span>
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.83rem', color: '#212529' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                    <CheckCircle2 size={14} style={{ color: '#198754' }} /> Confirmed
                                </span>
                                <span style={{ fontWeight: 600 }}>{deposits.confirmedCount} ({deposits.confirmedAmount.toFixed(8)} SOL)</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.83rem', color: '#212529' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                    <Clock size={14} style={{ color: '#FFC107' }} /> Pending / Processing
                                </span>
                                <span style={{ fontWeight: 600 }}>{deposits.pendingCount} ({deposits.pendingAmount.toFixed(8)} SOL)</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.83rem', color: '#212529' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                    <XCircle size={14} style={{ color: '#DC3545' }} /> Failed
                                </span>
                                <span style={{ fontWeight: 600 }}>{deposits.failedCount}</span>
                            </div>
                        </div>
                    </div>

                    {/* Withdrawal Breakdown */}
                    <div
                        style={{
                            background: '#FFFFFF',
                            borderRadius: '14px',
                            padding: '1rem 1.25rem',
                            border: '1px solid #DEE2E6',
                        }}
                    >
                        <h4 style={{ color: '#212529', fontSize: '0.9rem', fontWeight: 600, margin: '0 0 0.75rem 0', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <ArrowUpRight size={16} />
                            <span>Withdrawal Status Distribution</span>
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.83rem', color: '#212529' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                    <CheckCircle2 size={14} style={{ color: '#198754' }} /> Confirmed
                                </span>
                                <span style={{ fontWeight: 600 }}>{withdrawals.confirmedCount} ({withdrawals.confirmedAmount.toFixed(8)} SOL)</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.83rem', color: '#212529' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                    <Clock size={14} style={{ color: '#FFC107' }} /> Pending / Processing
                                </span>
                                <span style={{ fontWeight: 600 }}>{withdrawals.pendingCount} ({withdrawals.pendingAmount.toFixed(8)} SOL)</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.83rem', color: '#212529' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                    <XCircle size={14} style={{ color: '#DC3545' }} /> Failed
                                </span>
                                <span style={{ fontWeight: 600 }}>{withdrawals.failedCount}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
