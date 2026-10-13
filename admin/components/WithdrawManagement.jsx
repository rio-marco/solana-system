'use client';

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import moment from 'moment';
import { CopyButton } from '../lib/clipboard';
import { TransactionDecoderModal } from './TransactionDecoderModal';
import {
    ArrowUpRight,
    Search,
    ChevronLeft,
    ChevronRight,
    ExternalLink,
    Clock,
    CheckCircle2,
    XCircle,
    Eye,
    RefreshCw,
} from 'lucide-react';

function getStatusBadge(status) {
    switch (status) {
        case "CONFIRMED":
            return <span style={{ background: 'rgba(20,241,149,0.12)', color: '#14F195', border: '1px solid rgba(20,241,149,0.3)', padding: '0.2rem 0.65rem', borderRadius: '20px', fontSize: '0.73rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><CheckCircle2 size={11} />Confirmed</span>;
        case "FAILED":
            return <span style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', padding: '0.2rem 0.65rem', borderRadius: '20px', fontSize: '0.73rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><XCircle size={11} />Failed</span>;
        default:
            return <span style={{ background: 'rgba(245,158,11,0.12)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)', padding: '0.2rem 0.65rem', borderRadius: '20px', fontSize: '0.73rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><Clock size={11} />{status || 'Pending'}</span>;
    };
};

export function WithdrawManagement() {
    const [loading, setLoading] = useState(false);
    const [items, setItems] = useState([]);
    const [pagination, setPagination] = useState({
        totalCount: 0,
        totalPages: 1,
        currentPage: 1,
        limit: 10,
    });
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [selectedTxSig, setSelectedTxSig] = useState(null);

    useEffect(() => {
        const t = setTimeout(() => {
            setDebouncedSearch(searchTerm);
            setPagination(p => ({ ...p, currentPage: 1 }));
        }, 350);

        return () => clearTimeout(t);
    }, [searchTerm]);

    const fetchWithdrawals = useCallback(async () => {
        setLoading(true);
        try {
            const payload = {
                page: pagination.currentPage,
                limit: pagination.limit,
                status: statusFilter,
                search: debouncedSearch
            };

            const res = await axios.get('/api/admin/withdrawals', { params: payload });
            if (res.data?.flag && res.data?.data) {
                const d = res.data.data;
                setItems(d.withdrawals || []);
                setPagination(p => ({ ...p, totalCount: d.totalCount || 0, totalPages: d.totalPages || 1 }));
            } else {
                setItems([]);
            };
        } catch (err) {
            console.error(err);
            setItems([]);
        } finally {
            setLoading(false);
        };
    }, [pagination.currentPage, pagination.limit, statusFilter, debouncedSearch]);

    useEffect(() => {
        fetchWithdrawals();
    }, [fetchWithdrawals]);

    const handlePageChange = (pg) => {
        if (pg >= 1 && pg <= pagination.totalPages && !loading) {
            setPagination(p => ({ ...p, currentPage: pg }));
        };
    };

    const getPageNumbers = () => {
        const pages = [], total = pagination.totalPages, cur = pagination.currentPage;
        if (total <= 7) {
            for (let i = 1; i <= total; i++) {
                pages.push(i);
            };
        } else {
            pages.push(1);
            let s = Math.max(2, cur - 1), e = Math.min(total - 1, cur + 1);

            if (cur <= 3) {
                e = 4;
            } else if (cur >= total - 2) {
                s = total - 3;
            };

            if (s > 2) {
                pages.push('...');
            };

            for (let i = s; i <= e; i++) {
                pages.push(i);
            };

            if (e < total - 1) {
                pages.push('...');
            };

            pages.push(total);
        };

        return pages;
    };

    const selectStyle = { background: 'rgba(10,14,26,0.7)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '12px', padding: '0.6rem 1rem', color: '#fff', fontSize: '0.83rem', outline: 'none', cursor: 'pointer' };
    const startEntry = pagination.totalCount === 0 ? 0 : (pagination.currentPage - 1) * pagination.limit + 1;
    const endEntry = Math.min(pagination.currentPage * pagination.limit, pagination.totalCount);

    return (
        <div>
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '1.75rem',
                    flexWrap: 'wrap',
                    gap: '1rem',
                    padding: '1.75rem 1.5rem 1.25rem',
                    borderBottom: '1px solid rgba(255,255,255,0.07)',
                }}
            >
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#9945FF', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem' }}>
                        <ArrowUpRight size={16} /> Withdraw Management
                    </div>
                    <h1 style={{ color: '#fff', fontSize: '1.6rem', fontWeight: 900, margin: 0 }}>All User Withdrawals</h1>
                </div>
                <button type="button" onClick={fetchWithdrawals} disabled={loading} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', padding: '0.6rem 1.25rem', borderRadius: '12px', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: 700 }}>
                    <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Refresh
                </button>
            </div>

            <div style={{ background: 'rgba(15,20,34,0.75)', backdropFilter: 'blur(12px)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.08)', padding: '1.75rem', boxShadow: '0 20px 50px rgba(0,0,0,0.3)' }}>
                {/* Filters */}
                <div style={{ display: 'flex', gap: '0.85rem', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <div style={{ position: 'relative', flex: 1, minWidth: '260px' }}>
                        <Search size={14} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                        <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search by email, tx signature, memo, ID..." style={{ width: '100%', ...selectStyle, paddingLeft: '2.4rem' }} />
                    </div>
                    <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPagination(p => ({ ...p, currentPage: 1 })); }} style={selectStyle}>
                        <option value="ALL">All Statuses</option>
                        <option value="CONFIRMED">Confirmed</option>
                        <option value="PENDING">Pending</option>
                        <option value="FAILED">Failed</option>
                    </select>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#94a3b8', fontSize: '0.8rem' }}>
                        <span>Per page:</span>
                        <select value={pagination.limit} onChange={(e) => setPagination(p => ({ ...p, limit: parseInt(e.target.value, 10), currentPage: 1 }))} style={{ ...selectStyle, padding: '0.45rem 0.65rem' }}>
                            <option value={10}>10</option><option value={25}>25</option><option value={50}>50</option>
                        </select>
                    </div>
                </div>

                {/* Table */}
                <div style={{ overflowX: 'auto', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84rem' }}>
                        <thead>
                            <tr style={{ background: 'rgba(10,14,26,0.9)', color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                                <th style={{ padding: '0.9rem 1rem', fontWeight: 600 }}>User Email</th>
                                <th style={{ padding: '0.9rem 1rem', fontWeight: 600 }}>ID / Memo</th>
                                <th style={{ padding: '0.9rem 1rem', fontWeight: 600 }}>Amount (SOL)</th>
                                <th style={{ padding: '0.9rem 1rem', fontWeight: 600 }}>To Recipient Address</th>
                                <th style={{ padding: '0.9rem 1rem', fontWeight: 600 }}>Tx Signature</th>
                                <th style={{ padding: '0.9rem 1rem', fontWeight: 600 }}>Status</th>
                                <th style={{ padding: '0.9rem 1rem', fontWeight: 600 }}>Date & Time</th>
                                <th style={{ padding: '0.9rem 1rem', fontWeight: 600, textAlign: 'center' }}>Details</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={8} style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                                        <div style={{ width: '32px', height: '32px', border: '3px solid rgba(153,69,255,0.2)', borderTop: '3px solid #9945FF', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 0.75rem' }} />
                                        <span>Fetching withdrawals...</span>
                                    </td>
                                </tr>
                            ) : items.length === 0 ? (
                                <tr>
                                    <td colSpan={8} style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>No withdrawal transactions found.</td>
                                </tr>
                            ) : items.map((item) => {
                                const id = item.withdrawId || item._id;
                                const userEmail = item.userId?.email || 'N/A';
                                const userName = item.userId?.fullName || '';
                                const txSig = item.transactionSignature;
                                const targetAddr = item.toAddress || 'N/A';

                                return (
                                    <tr key={item._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.15s' }} className="hover:bg-white/5">
                                        <td style={{ padding: '0.85rem 1rem' }}>
                                            <div style={{ color: '#fff', fontWeight: 600 }}>{userEmail}</div>
                                            {userName && <div style={{ color: '#64748b', fontSize: '0.75rem' }}>{userName}</div>}
                                        </td>
                                        <td style={{ padding: '0.85rem 1rem' }}>
                                            <div style={{ color: '#94a3b8', fontFamily: 'monospace', fontSize: '0.78rem' }}>{id}</div>
                                            <div style={{ color: '#9945FF', fontWeight: 700, fontSize: '0.75rem' }}>Memo: {item.memo}</div>
                                        </td>
                                        <td style={{ padding: '0.85rem 1rem', fontWeight: 800, color: '#9945FF' }}>-{item.amount} SOL</td>
                                        <td style={{ padding: '0.85rem 1rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                                <span style={{ fontFamily: 'monospace', color: '#94a3b8', fontSize: '0.75rem' }}>{targetAddr.length > 12 ? `${targetAddr.slice(0, 6)}...${targetAddr.slice(-6)}` : targetAddr}</span>
                                                <CopyButton text={targetAddr} />
                                            </div>
                                        </td>
                                        <td style={{ padding: '0.85rem 1rem' }}>
                                            {txSig ? (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                                    <span style={{ fontFamily: 'monospace', color: '#64748b', fontSize: '0.75rem' }}>{`${txSig.slice(0, 6)}...${txSig.slice(-6)}`}</span>
                                                    <CopyButton text={txSig} />
                                                    <a href={`https://explorer.solana.com/tx/${txSig}?cluster=devnet`} target="_blank" rel="noopener noreferrer" style={{ color: '#9945FF' }}><ExternalLink size={12} /></a>
                                                </div>
                                            ) : <span style={{ color: '#475569', fontSize: '0.75rem' }}>—</span>}
                                        </td>
                                        <td style={{ padding: '0.85rem 1rem' }}>{getStatusBadge(item.status)}</td>
                                        <td style={{ padding: '0.85rem 1rem', color: '#64748b', fontSize: '0.75rem' }}>{moment(item.createdAt).format('MMM DD, YYYY HH:mm')}</td>
                                        <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                                            {txSig ? (
                                                <button type="button" onClick={() => setSelectedTxSig(txSig)} style={{ background: 'rgba(153,69,255,0.15)', border: '1px solid rgba(153,69,255,0.3)', color: '#fff', padding: '0.35rem 0.6rem', borderRadius: '8px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.73rem', fontWeight: 600 }}>
                                                    <Eye size={12} /> Decode
                                                </button>
                                            ) : <span style={{ color: '#475569', fontSize: '0.75rem' }}>—</span>}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {pagination.totalCount > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.08)', flexWrap: 'wrap', gap: '1rem' }}>
                        <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Showing <strong style={{ color: '#fff' }}>{startEntry}</strong> to <strong style={{ color: '#fff' }}>{endEntry}</strong> of <strong style={{ color: '#fff' }}>{pagination.totalCount}</strong> entries</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <button type="button" onClick={() => handlePageChange(pagination.currentPage - 1)} disabled={pagination.currentPage <= 1 || loading} style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: pagination.currentPage <= 1 ? '#475569' : '#cbd5e1', cursor: pagination.currentPage <= 1 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <ChevronLeft size={16} />
                            </button>
                            {getPageNumbers().map((p, idx) => p === '...' ? <span key={`e-${idx}`} style={{ width: '32px', textAlign: 'center', color: '#64748b' }}>...</span> : <button key={`p-${p}`} type="button" onClick={() => handlePageChange(p)} disabled={loading || p === pagination.currentPage} style={{ minWidth: '36px', height: '36px', padding: '0 0.5rem', borderRadius: '10px', background: p === pagination.currentPage ? 'linear-gradient(135deg,#9945FF,#14F195)' : 'rgba(255,255,255,0.05)', border: p === pagination.currentPage ? 'none' : '1px solid rgba(255,255,255,0.12)', color: '#fff', fontWeight: p === pagination.currentPage ? 800 : 500, cursor: p === pagination.currentPage ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{p}</button>)}
                            <button type="button" onClick={() => handlePageChange(pagination.currentPage + 1)} disabled={pagination.currentPage >= pagination.totalPages || loading} style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: pagination.currentPage >= pagination.totalPages ? '#475569' : '#cbd5e1', cursor: pagination.currentPage >= pagination.totalPages ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {selectedTxSig && <TransactionDecoderModal signature={selectedTxSig} onClose={() => setSelectedTxSig(null)} />}
        </div>
    );
};