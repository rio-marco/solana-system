'use client';

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import moment from 'moment';
import { RefreshCw, Timer, Clock, CheckCircle2, ExternalLink, Copy, Check, } from 'lucide-react';
import { getTransactionStatus } from './transaction-status.mjs';
import { copyTextToClipboard } from '../lib/clipboard';
import {
    DEFAULT_CURRENT_PAGE,
    DEFAULT_ITEM_PER_PAGE,
} from './ui-constants.mjs';
import { Pagination } from './Pagination';

const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;
const MINUTE_MS = 60 * 1000;
const SECOND_MS = 1000;

const formatRemaining = (ms) => {
    if (ms <= 0) return '00d 00h 00m 00s';

    const days = Math.floor(ms / DAY_MS);
    const hours = Math.floor((ms % DAY_MS) / HOUR_MS);
    const minutes = Math.floor((ms % HOUR_MS) / MINUTE_MS);
    const seconds = Math.floor((ms % MINUTE_MS) / SECOND_MS);

    const pad = (n) => String(n).padStart(2, '0');

    return `${pad(days)}d ${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`;
};

export const UnlockTimerList = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isFetchingPage, setIsFetchingPage] = useState(false);
    const [clockOffset, setClockOffset] = useState(0);
    const [now, setNow] = useState(Date.now());
    const [copiedId, setCopiedId] = useState(null);
    const [pagination, setPagination] = useState({
        totalCount: 0,
        totalPages: 0,
        currentPage: DEFAULT_CURRENT_PAGE,
        limit: DEFAULT_ITEM_PER_PAGE,
    });

    const fetchList = useCallback(async () => {
        setIsFetchingPage(true);

        try {
            const params = {
                page: pagination.currentPage,
                limit: pagination.limit,
            };

            const res = await axios.get('/api/transaction/unlock-timer', { params });
            if (res.data && res.data?.flag && res.data?.data) {
                const d = res.data.data;

                setItems(d.transactions || []);
                setPagination((p) => ({
                    ...p,
                    totalCount: d.totalCount || 0,
                    totalPages: d.totalPages || 0,
                }));

                if (d.serverNow) {
                    setClockOffset(new Date(d.serverNow).getTime() - Date.now());
                };
            } else {
                setItems([]);
            };
        } catch (e) {
            console.error('Failed to fetch unlock timer list:', e);
            setItems([]);
        } finally {
            setLoading(false);
            setIsFetchingPage(false);
        };
    }, [pagination.currentPage, pagination.limit]);

    useEffect(() => {
        fetchList();
    }, [fetchList]);

    useEffect(() => {
        const timer = setInterval(() => {
            setNow(Date.now() + clockOffset);
        }, 1000);

        return () => clearInterval(timer);
    }, [clockOffset]);

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

    const handlePageChange = (pg) => {
        if (pg >= 1 && pg <= pagination.totalPages && !loading) {
            setPagination((p) => ({ ...p, currentPage: pg }));
        };
    };

    return (
        <div style={{ background: 'rgba(15, 20, 34, 0.85)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '24px', padding: '1.5rem 1.75rem', marginTop: 0, boxShadow: '0 20px 40px rgba(0,0,0,0.5)', overflow: 'hidden' }}>
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '1rem',
                    paddingBottom: '1.25rem',
                    flexWrap: 'wrap',
                    gap: '0.5rem',
                    borderBottom: '1px solid rgba(255,255,255,0.08)',
                }}
            >
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Timer size={20} style={{ color: '#F59E0B' }} />
                    <span>Unlocking Transactions</span>
                </h2>
                <button
                    type="button"
                    onClick={fetchList}
                    disabled={loading || isFetchingPage}
                    className="solana-btn-outline"
                    style={{ width: 'auto', padding: '0 0.85rem', height: '34px', fontSize: '0.78rem' }}
                >
                    <RefreshCw size={13} className={isFetchingPage ? 'animate-spin' : ''} />
                    <span>Refresh</span>
                </button>
            </div>

            {/* Table */}
            <div className="tx-table-scroll" style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem', minWidth: '880px', whiteSpace: 'nowrap' }}>
                    <thead>
                        <tr style={{ color: '#64748b', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                            <th style={{ padding: '0.9rem 1rem', fontWeight: 600 }}>#</th>
                            <th style={{ padding: '0.9rem 1rem', fontWeight: 600 }}>TX HASH</th>
                            <th style={{ padding: '0.9rem 1rem', fontWeight: 600 }}>AMOUNT</th>
                            <th style={{ padding: '0.9rem 1rem', fontWeight: 600 }}>DESCRIPTION</th>
                            <th style={{ padding: '0.9rem 1rem', fontWeight: 600 }}>STATUS</th>
                            <th style={{ padding: '0.9rem 1rem', fontWeight: 600 }}>TRANSACTION ON</th>
                            <th style={{ padding: '0.9rem 1rem', fontWeight: 600 }}>UNLOCK ON</th>
                            <th style={{ padding: '0.9rem 1rem', fontWeight: 600, textAlign: 'center' }}>TIME REMAINING</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }}>
                                    <div style={{ width: '32px', height: '32px', border: '3px solid rgba(153,69,255,0.3)', borderTop: '3px solid #9945FF', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 0.75rem' }} />
                                    <span>Loading unlocking transactions...</span>
                                </td>
                            </tr>
                        ) : items.length === 0 ? (
                            <tr>
                                <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }} className="font-mono">
                                    No transactions are waiting to unlock.
                                </td>
                            </tr>
                        ) : items.map((tx, index) => {
                            const rowId = tx.txId || tx._id;
                            const { label, ...statusStyle } = getTransactionStatus(tx.status);
                            const unlockAt = tx.unlockAt ? new Date(tx.unlockAt).getTime() : null;
                            const remaining = unlockAt ? unlockAt - now : 0;
                            const isUnlocked = remaining <= 0;
                            const seq = (pagination.currentPage - 1) * pagination.limit + index + 1;

                            return (
                                <tr key={rowId} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                    {/* index */}
                                    <td style={{ padding: '0.85rem 1rem' }}>
                                        <div style={{ color: '#FFFFFF', fontWeight: 700 }}>{index + 1}</div>
                                    </td>
                                    {/* TRX Hash */}
                                    <td style={{ padding: '0.85rem 1rem' }}>
                                        {tx.transactionSignature ? (
                                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', maxWidth: '100%', overflow: 'hidden' }}>
                                                <a
                                                    href={`https://explorer.solana.com/tx/${tx.transactionSignature}?cluster=devnet`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="solana-link font-mono"
                                                    style={{ fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                                                    title="View on Solana Explorer"
                                                >
                                                    <span>{tx.transactionSignature.slice(0, 8)}...{tx.transactionSignature.slice(-6)}</span>
                                                    <ExternalLink size={11} />
                                                </a>
                                                <button
                                                    type="button"
                                                    onClick={() => handleCopyHash(tx.transactionSignature, rowId)}
                                                    style={{
                                                        background: copiedId === rowId ? 'rgba(20,241,149,0.15)' : 'rgba(255, 255, 255, 0.06)',
                                                        border: '1px solid ' + (copiedId === rowId ? 'rgba(20,241,149,0.3)' : 'rgba(255, 255, 255, 0.12)'),
                                                        borderRadius: '5px',
                                                        padding: '2px 6px',
                                                        color: copiedId === rowId ? '#14F195' : '#94a3b8',
                                                        cursor: 'pointer',
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '3px',
                                                        fontSize: '0.7rem',
                                                        transition: 'all 0.2s ease',
                                                        flexShrink: 0,
                                                    }}
                                                    title="Copy Full Transaction Hash"
                                                >
                                                    {copiedId === rowId ? (
                                                        <>
                                                            <Check size={11} style={{ color: '#14F195' }} />
                                                            <span style={{ fontSize: '0.68rem', color: '#14F195', fontWeight: 600 }}>Copied!</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Copy size={11} />
                                                            <span style={{ fontSize: '0.68rem' }}>Copy</span>
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        ) : (
                                            <span style={{ color: '#64748b' }} className="font-mono">-</span>
                                        )}
                                    </td>
                                    {/* Transaction Amount */}
                                    <td className="font-mono" style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#fff', fontSize: '0.8rem' }}>
                                        {tx.amount} BTCR
                                    </td>
                                    {/* Description */}
                                    <td className="font-mono" style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#fff', fontSize: '0.8rem' }}>
                                        {tx?.description ? (
                                            <span>{tx?.description}</span>
                                        ) : (
                                            <span style={{ color: '#64748b' }} className="font-mono">-</span>
                                        )}
                                    </td>
                                    {/* status */}
                                    <td style={{ padding: '0.85rem 1rem' }}>
                                        <span
                                            style={{
                                                padding: '0.2rem 0.5rem',
                                                borderRadius: '20px',
                                                fontSize: '0.68rem',
                                                fontWeight: 700,
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.4px',
                                                background: statusStyle.background,
                                                color: statusStyle.color,
                                                border: `1px solid ${statusStyle.border}`,
                                            }}
                                        >
                                            {label}
                                        </span>
                                    </td>
                                    {/* Transaction Created At */}
                                    <td style={{ padding: '0.85rem 1rem', color: '#94a3b8', fontSize: '0.72rem' }}>
                                        {tx?.createdAt ? moment(tx?.createdAt).format('MMM DD, YYYY HH:mm:ss A') : '-'}
                                    </td>
                                    {/* Transaction Unlock At */}
                                    <td style={{ padding: '0.85rem 1rem', color: '#94a3b8', fontSize: '0.72rem' }}>
                                        {unlockAt ? moment(unlockAt).format('MMM DD, YYYY HH:mm:ss A') : '-'}
                                    </td>
                                    {/* Time Remaining */}
                                    <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                                        {isUnlocked ? (
                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: '#14F195', fontWeight: 700, fontSize: '0.75rem' }}>
                                                <CheckCircle2 size={14} />
                                                <span>Available</span>
                                            </span>
                                        ) : (
                                            <span
                                                className="font-mono"
                                                style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '0.4rem',
                                                    padding: '0.25rem 0.6rem',
                                                    borderRadius: '8px',
                                                    background: 'rgba(245,158,11,0.12)',
                                                    border: '1px solid rgba(245,158,11,0.3)',
                                                    color: '#F59E0B',
                                                    fontWeight: 700,
                                                    fontSize: '0.75rem',
                                                    letterSpacing: '0.3px',
                                                }}
                                            >
                                                <Clock size={13} />
                                                <span>{formatRemaining(remaining)}</span>
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <Pagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                totalCount={pagination.totalCount}
                limit={pagination.limit}
                onPageChange={handlePageChange}
                loading={loading}
                itemLabel="transactions"
            />
        </div>
    );
};

export default UnlockTimerList;