'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { RefreshCw, ExternalLink, ListFilter, Copy, Check } from 'lucide-react';
import { copyTextToClipboard } from '../lib/clipboard';

export const TransactionListTable = ({ refreshTrigger }) => {
    const [withdrawals, setWithdrawals] = useState([]);
    const [loading, setLoading] = useState(false);
    const [copiedId, setCopiedId] = useState(null);

    const fetchHistory = async () => {
        try {
            setLoading(true);
            const res = await axios.get('/api/withdraw/list');
            if (res.data && res.data.flag && res.data.data) {
                setWithdrawals(res.data.data.withdrawals || []);
            };
        } catch (e) {
            // ignore
        } finally {
            setLoading(false);
        };
    };

    useEffect(() => {
        fetchHistory();
    }, [refreshTrigger]);

    const handleCopyHash = async (hash, id) => {
        if (hash) {
            const ok = await copyTextToClipboard(hash);
            if (ok) {
                setCopiedId(id);
                setTimeout(() => {
                    setCopiedId(null);
                }, 2000);
            };
        };
    };

    return (
        <div style={{ background: 'rgba(15, 20, 34, 0.85)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '24px', padding: '2rem', marginTop: '2rem', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <ListFilter size={20} style={{ color: '#9945FF' }} />
                    <span>Withdraw List</span>
                </h2>
                <button
                    onClick={fetchHistory}
                    disabled={loading}
                    className="solana-btn-outline"
                    style={{ width: 'auto', padding: '0 1rem', height: '38px', fontSize: '0.8rem' }}
                >
                    <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                    <span>Refresh</span>
                </button>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem 0', color: '#64748b', fontSize: '0.85rem' }}>Loading transaction history...</div>
            ) : withdrawals.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3.5rem 0', color: '#64748b', fontSize: '0.85rem' }} className="font-mono">
                    No withdrawals recorded yet.
                </div>
            ) : (
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', color: '#64748b', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                <th style={{ padding: '0.85rem 0.5rem', fontSize: '0.75rem', fontWeight: 700 }}>TRANSACTION HASH (EXPLORER URL)</th>
                                <th style={{ padding: '0.85rem 0.5rem', fontSize: '0.75rem', fontWeight: 700 }}>AMOUNT (SOL)</th>
                                <th style={{ padding: '0.85rem 0.5rem', fontSize: '0.75rem', fontWeight: 700 }}>STATUS</th>
                                <th style={{ padding: '0.85rem 0.5rem', fontSize: '0.75rem', fontWeight: 700 }}>CREATED DATE</th>
                            </tr>
                        </thead>
                        <tbody>
                            {withdrawals.map((w) => {
                                const rowId = w._id || w.withdrawId;
                                return (
                                    <tr key={rowId} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                        <td style={{ padding: '1rem 0.5rem' }}>
                                            {w.transactionSignature ? (
                                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <a
                                                        href={`https://explorer.solana.com/tx/${w.transactionSignature}?cluster=devnet`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="solana-link font-mono"
                                                        style={{ fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                                        title="View on Solana Explorer"
                                                    >
                                                        <span>{w.transactionSignature.slice(0, 16)}...{w.transactionSignature.slice(-8)}</span>
                                                        <ExternalLink size={12} />
                                                    </a>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleCopyHash(w.transactionSignature, rowId)}
                                                        style={{
                                                            background: copiedId === rowId ? 'rgba(20,241,149,0.15)' : 'rgba(255, 255, 255, 0.06)',
                                                            border: '1px solid ' + (copiedId === rowId ? 'rgba(20,241,149,0.3)' : 'rgba(255, 255, 255, 0.12)'),
                                                            borderRadius: '6px',
                                                            padding: '4px 8px',
                                                            color: copiedId === rowId ? '#14F195' : '#94a3b8',
                                                            cursor: 'pointer',
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: '4px',
                                                            fontSize: '0.75rem',
                                                            transition: 'all 0.2s ease',
                                                        }}
                                                        title="Copy Full Transaction Hash"
                                                    >
                                                        {copiedId === rowId ? (
                                                            <>
                                                                <Check size={12} style={{ color: '#14F195' }} />
                                                                <span style={{ fontSize: '0.7rem', color: '#14F195', fontWeight: 600 }}>Copied!</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Copy size={12} />
                                                                <span style={{ fontSize: '0.7rem' }}>Copy</span>
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                            ) : (
                                                <span style={{ color: '#64748b' }} className="font-mono">-</span>
                                            )}
                                        </td>
                                        <td className="font-mono" style={{ padding: '1rem 0.5rem', fontWeight: 700, color: '#fff' }}>{w.amount} SOL</td>
                                        <td style={{ padding: '1rem 0.5rem' }}>
                                            <span
                                                style={{
                                                    padding: '0.25rem 0.75rem',
                                                    borderRadius: '20px',
                                                    fontSize: '0.75rem',
                                                    fontWeight: 700,
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.5px',
                                                    background: w.status === 'CONFIRMED' ? 'rgba(20,241,149,0.15)' : w.status === 'PENDING' ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)',
                                                    color: w.status === 'CONFIRMED' ? '#14F195' : w.status === 'PENDING' ? '#F59E0B' : '#ef4444',
                                                    border: '1px solid ' + (w.status === 'CONFIRMED' ? 'rgba(20,241,149,0.3)' : w.status === 'PENDING' ? 'rgba(245,158,11,0.3)' : 'rgba(239,68,68,0.3)'),
                                                }}
                                            >
                                                {w.status}
                                            </span>
                                        </td>
                                        <td className="font-mono" style={{ padding: '1rem 0.5rem', color: '#94a3b8', fontSize: '0.8rem' }}>
                                            {w.createdAt ? new Date(w.createdAt).toLocaleString() : '-'}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};