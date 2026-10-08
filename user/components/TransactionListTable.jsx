'use client';

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { RefreshCw, ExternalLink, ListFilter, Copy, Check, ArrowDownLeft, ArrowUpRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { copyTextToClipboard } from '../lib/clipboard';

export const TransactionListTable = ({ type = 'withdraw', refreshTrigger }) => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isFetchingPage, setIsFetchingPage] = useState(false);
    const [copiedId, setCopiedId] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const limit = 10;

    const isDeposit = type === 'deposit';
    const endpoint = isDeposit ? '/api/deposit/list' : '/api/withdraw/list';
    const titleText = isDeposit ? 'Deposit List' : 'Withdraw List';
    const emptyText = isDeposit ? 'No deposits recorded yet.' : 'No withdrawals recorded yet.';

    useEffect(() => {
        setCurrentPage(1);
    }, [type, refreshTrigger]);

    const fetchHistory = useCallback(async (pageToFetch) => {
        const p = pageToFetch !== undefined ? pageToFetch : currentPage;
        try {
            setIsFetchingPage(true);
            const res = await axios.get(`${endpoint}?page=${p}&limit=${limit}`);
            if (res.data && res.data.flag && res.data.data) {
                const list = isDeposit ? res.data.data.deposits : res.data.data.withdrawals;
                setItems(list || []);
                setTotalPages(res.data.data.totalPages || 1);
                setTotalCount(res.data.data.totalCount || 0);
            };
        } catch (e) {
            // ignore
        } finally {
            setLoading(false);
            setIsFetchingPage(false);
        };
    }, [endpoint, isDeposit]);

    useEffect(() => {
        fetchHistory(currentPage);
    }, [fetchHistory, currentPage, refreshTrigger]);

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

    const handlePageChange = (e, newPage) => {
        if (e && e.preventDefault) e.preventDefault();
        if (e && e.stopPropagation) e.stopPropagation();
        if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage && !isFetchingPage) {
            setCurrentPage(newPage);
        };
    };

    const startEntry = totalCount === 0 ? 0 : (currentPage - 1) * limit + 1;
    const endEntry = Math.min(currentPage * limit, totalCount);

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
                    onClick={(e) => { e.preventDefault(); fetchHistory(currentPage); }}
                    disabled={loading || isFetchingPage}
                    className="solana-btn-outline"
                    style={{ width: 'auto', padding: '0 0.85rem', height: '34px', fontSize: '0.78rem' }}
                >
                    <RefreshCw size={13} className={isFetchingPage ? 'animate-spin' : ''} />
                    <span>Refresh</span>
                </button>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '2.5rem 0', color: '#64748b', fontSize: '0.85rem' }}>Loading transaction history...</div>
            ) : items.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2.5rem 0', color: '#64748b', fontSize: '0.85rem' }} className="font-mono">
                    {emptyText}
                </div>
            ) : (
                <>
                    <div style={{ overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', tableLayout: 'fixed' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', color: '#64748b', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    <th style={{ padding: '0.65rem 0.35rem', fontSize: '0.7rem', fontWeight: 700, width: '48%' }}>TX HASH</th>
                                    <th style={{ padding: '0.65rem 0.35rem', fontSize: '0.7rem', fontWeight: 700, width: '20%' }}>AMOUNT</th>
                                    <th style={{ padding: '0.65rem 0.35rem', fontSize: '0.7rem', fontWeight: 700, width: '18%' }}>STATUS</th>
                                    <th style={{ padding: '0.65rem 0.35rem', fontSize: '0.7rem', fontWeight: 700, width: '14%', textAlign: 'right' }}>DATE</th>
                                </tr>
                            </thead>
                            <tbody style={{ opacity: isFetchingPage ? 0.35 : 1, transition: 'opacity 0.2s ease', pointerEvents: isFetchingPage ? 'none' : 'auto' }}>
                                {items.map((w) => {
                                    const rowId = w._id || w.withdrawId || w.depositId;
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
                                                        background: w.status === 'CONFIRMED' ? 'rgba(20,241,149,0.15)' : w.status === 'PENDING' ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)',
                                                        color: w.status === 'CONFIRMED' ? '#14F195' : w.status === 'PENDING' ? '#F59E0B' : '#ef4444',
                                                        border: '1px solid ' + (w.status === 'CONFIRMED' ? 'rgba(20,241,149,0.3)' : w.status === 'PENDING' ? 'rgba(245,158,11,0.3)' : 'rgba(239,68,68,0.3)'),
                                                    }}
                                                >
                                                    {w.status}
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

                    {/* Pagination Controls */}
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginTop: '1.5rem',
                            paddingTop: '1rem',
                            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                            flexWrap: 'wrap',
                            gap: '1rem',
                        }}
                    >
                        <div style={{ fontSize: '0.8rem', color: '#94a3b8' }} className="font-mono">
                            Showing <span style={{ color: '#fff', fontWeight: 600 }}>{startEntry}</span> to <span style={{ color: '#fff', fontWeight: 600 }}>{endEntry}</span> of <span style={{ color: '#fff', fontWeight: 600 }}>{totalCount}</span> entries
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <button
                                type="button"
                                onClick={(e) => handlePageChange(e, currentPage - 1)}
                                disabled={currentPage === 1 || loading || isFetchingPage}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: '32px',
                                    height: '32px',
                                    padding: 0,
                                    borderRadius: '8px',
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    color: currentPage === 1 ? '#475569' : '#e2e8f0',
                                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.2s ease',
                                }}
                                title="Previous Page"
                            >
                                <ChevronLeft size={16} />
                            </button>

                            {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((pageNum) => (
                                <button
                                    key={pageNum}
                                    type="button"
                                    onClick={(e) => handlePageChange(e, pageNum)}
                                    disabled={loading || isFetchingPage}
                                    style={{
                                        minWidth: '32px',
                                        height: '32px',
                                        borderRadius: '8px',
                                        background: pageNum === currentPage ? (isDeposit ? 'linear-gradient(135deg, #14F195 0%, #9945FF 100%)' : 'linear-gradient(135deg, #9945FF 0%, #14F195 100%)') : 'rgba(255, 255, 255, 0.05)',
                                        border: pageNum === currentPage ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
                                        color: pageNum === currentPage ? '#0f172a' : '#e2e8f0',
                                        fontWeight: pageNum === currentPage ? 700 : 500,
                                        fontSize: '0.8rem',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        lineHeight: 1,
                                        textAlign: 'center',
                                    }}
                                >
                                    {pageNum}
                                </button>
                            ))}

                            <button
                                type="button"
                                onClick={(e) => handlePageChange(e, currentPage + 1)}
                                disabled={currentPage >= totalPages || loading || isFetchingPage}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    minWidth: '32px',
                                    height: '32px',
                                    padding: 0,
                                    borderRadius: '8px',
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    color: currentPage >= totalPages ? '#475569' : '#e2e8f0',
                                    cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.2s ease',
                                }}
                                title="Next Page"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};