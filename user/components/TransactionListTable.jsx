'use client';

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { RefreshCw, ExternalLink, ListFilter, Copy, Check, ArrowDownLeft, ArrowUpRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { copyTextToClipboard } from '../lib/clipboard';
import { getTransactionStatus } from './transaction-status.mjs';
import {
    TRANSACTION_STATUS,
    DEFAULT_CURRENT_PAGE,
    DEFAULT_ITEM_PER_PAGE,
} from './ui-constants.mjs';
import { Pagination } from './Pagination';

export const TransactionListTable = ({ type = 'withdraw' }) => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isFetchingPage, setIsFetchingPage] = useState(false);
    const [copiedId, setCopiedId] = useState(null);
    const [pagination, setPagination] = useState({
        totalCount: 0,
        totalPages: 0,
        currentPage: DEFAULT_CURRENT_PAGE,
        limit: DEFAULT_ITEM_PER_PAGE,
    });

    const isDeposit = type === 'deposit';
    const endpoint = isDeposit ? '/api/deposit/list' : '/api/withdraw/list';
    const titleText = isDeposit ? 'Deposit List' : 'Withdraw List';
    const emptyText = isDeposit ? 'No deposits recorded yet.' : 'No withdrawals recorded yet.';

    const fetchHistory = useCallback(async () => {
        setIsFetchingPage(true);

        try {
            const params = {
                page: pagination.currentPage,
                limit: pagination.limit,
            };

            const res = await axios.get(`${endpoint}`, { params });
            // const res = await axios.get(`${endpoint}?page=${p}&limit=${limit}`);
            if (res.data && res.data?.flag && res.data?.data) {
                const d = res.data.data;

                const list = isDeposit ? d.deposits : d.withdrawals;
                setItems(list || []);
                setPagination(p => ({
                    ...p,
                    totalCount: d.totalCount || 0,
                    totalPages: d.totalPages || 0,
                }));
            } else {
                setItems([]);
            };
        } catch (e) {
            console.error('Failed to fetch transaction:', err);
            setItems([]);
        } finally {
            setLoading(false);
            setIsFetchingPage(false);
        };
    }, [pagination.currentPage, pagination.limit, endpoint, isDeposit]);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

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

    const handleLimitChange = (e) => {
        setPagination(p => ({
            ...p,
            limit: parseInt(e.target.value, 10),
            currentPage: DEFAULT_CURRENT_PAGE,
        }));
    };

    const handlePageChange = (pg) => {
        if (pg >= 1 && pg <= pagination.totalPages && !loading) {
            setPagination(p => ({ ...p, currentPage: pg }));
        };
    };

    return (
        <div style={{ background: 'rgba(15, 20, 34, 0.85)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '24px', padding: '1.5rem 1.75rem', marginTop: 0, boxShadow: '0 20px 40px rgba(0,0,0,0.5)', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {isDeposit ? (
                        <ArrowDownLeft size={20} style={{ color: '#14F195' }} />
                    ) : (
                        <ArrowUpRight size={20} style={{ color: '#9945FF' }} />
                    )}
                    <span>{titleText}</span>
                </h2>
                <button
                    type="button"
                    onClick={fetchHistory}
                    disabled={loading || isFetchingPage}
                    className="solana-btn-outline"
                    style={{ width: 'auto', padding: '0 0.85rem', height: '34px', fontSize: '0.78rem' }}
                >
                    <RefreshCw size={13} className={isFetchingPage ? 'animate-spin' : ''} />
                    <span>Refresh</span>
                </button>
            </div>

            {/* Table */}
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
                    <thead>
                        <tr
                            style={{
                                // background: '#F5F9FC',
                                color: '#64748b',
                                borderBottom: '1px solid rgba(255,255,255,0.08)',
                            }}
                        >
                            <th style={{ padding: '0.65rem 0.35rem', fontSize: '0.7rem', fontWeight: 700, width: '48%' }}>TX HASH</th>
                            <th style={{ padding: '0.65rem 0.35rem', fontSize: '0.7rem', fontWeight: 700, width: '20%' }}>AMOUNT</th>
                            <th style={{ padding: '0.65rem 0.35rem', fontSize: '0.7rem', fontWeight: 700, width: '18%' }}>STATUS</th>
                            <th style={{ padding: '0.65rem 0.35rem', fontSize: '0.7rem', fontWeight: 700, width: '14%', textAlign: 'right' }}>DATE</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={4} style={{ padding: '3rem', textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }}>
                                    <div style={{ width: '32px', height: '32px', border: '3px solid rgba(153,69,255,0.3)', borderTop: '3px solid #9945FF', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 0.75rem' }} />
                                    <span>Loading transaction history...</span>
                                </td>
                            </tr>
                        ) : items.length === 0 ? (
                            <tr>
                                <td colSpan={4} style={{ padding: '3rem', textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }} className="font-mono">
                                    {emptyText}
                                </td>
                            </tr>
                        ) : items.map((w) => {
                            const rowId = w.txId || w._id;
                            const { label, ...statusStyle } = getTransactionStatus(w.status);

                            return (
                                <tr key={rowId} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                    <td style={{ padding: '0.65rem 0.35rem' }}>
                                        {w.transactionSignature ? (
                                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', maxWidth: '100%', overflow: 'hidden' }}>
                                                <a
                                                    href={`https://explorer.solana.com/tx/${w.transactionSignature}?cluster=devnet`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="solana-link font-mono"
                                                    style={{ fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                                                    title="View on Solana Explorer"
                                                >
                                                    <span>{w.transactionSignature.slice(0, 8)}...{w.transactionSignature.slice(-6)}</span>
                                                    <ExternalLink size={11} />
                                                </a>
                                                <button
                                                    type="button"
                                                    onClick={() => handleCopyHash(w.transactionSignature, rowId)}
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
                                    <td className="font-mono" style={{ padding: '0.65rem 0.35rem', fontWeight: 700, color: '#fff', fontSize: '0.8rem' }}>{w.amount} SOL</td>
                                    <td style={{ padding: '0.65rem 0.35rem' }}>
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
                                    <td className="font-mono" style={{ padding: '0.65rem 0.35rem', color: '#94a3b8', fontSize: '0.72rem', textAlign: 'right' }}>
                                        {w.createdAt ? new Date(w.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '-'}
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