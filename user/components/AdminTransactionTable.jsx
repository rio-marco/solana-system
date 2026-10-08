'use client';

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { CopyButton } from '../lib/clipboard';
import { TransactionDecoderModal } from './TransactionDecoderModal';
import {
    ArrowDownLeft,
    ArrowUpRight,
    Search,
    Filter,
    ChevronLeft,
    ChevronRight,
    ExternalLink,
    Clock,
    CheckCircle2,
    XCircle,
    Eye,
    RefreshCw,
} from 'lucide-react';
import moment from 'moment';

export function AdminTransactionTable({ refreshTrigger }) {
    const [activeTab, setActiveTab] = useState('deposit'); // 'deposit' | 'withdraw'
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

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
            setPagination((prev) => ({ ...prev, currentPage: 1 }));
        }, 350);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const fetchAdminTransactions = useCallback(async () => {
        setLoading(true);
        try {
            const endpoint = activeTab === 'deposit' ? '/api/admin/deposits' : '/api/admin/withdrawals';
            const params = {
                page: pagination.currentPage,
                limit: pagination.limit,
                status: statusFilter,
                search: debouncedSearch,
            };

            const res = await axios.get(endpoint, { params });
            if (res.data && res.data.flag && res.data.data) {
                const data = res.data.data;
                const list = activeTab === 'deposit' ? (data.deposits || []) : (data.withdrawals || []);
                setItems(list);
                setPagination((prev) => ({
                    ...prev,
                    totalCount: data.totalCount || 0,
                    totalPages: data.totalPages || 1,
                }));
            } else {
                setItems([]);
            };
        } catch (err) {
            console.error('Failed to fetch admin transactions:', err);
            setItems([]);
        } finally {
            setLoading(false);
        };
    }, [activeTab, pagination.currentPage, pagination.limit, statusFilter, debouncedSearch]);

    useEffect(() => {
        fetchAdminTransactions();
    }, [fetchAdminTransactions, refreshTrigger]);

    const handleTabChange = (newTab) => {
        setActiveTab(newTab);
        setPagination((prev) => ({ ...prev, currentPage: 1 }));
    };

    const handleStatusFilterChange = (e) => {
        setStatusFilter(e.target.value);
        setPagination((prev) => ({ ...prev, currentPage: 1 }));
    };

    const handleLimitChange = (e) => {
        const newLimit = parseInt(e.target.value, 10);
        setPagination((prev) => ({ ...prev, limit: newLimit, currentPage: 1 }));
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'CONFIRMED':
                return (
                    <span
                        style={{
                            background: 'rgba(20, 241, 149, 0.12)',
                            color: '#14F195',
                            border: '1px solid rgba(20, 241, 149, 0.3)',
                            padding: '0.2rem 0.65rem',
                            borderRadius: '20px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                        }}
                    >
                        <CheckCircle2 size={12} />
                        <span>Confirmed</span>
                    </span>
                );
            case 'FAILED':
                return (
                    <span
                        style={{
                            background: 'rgba(239, 68, 68, 0.12)',
                            color: '#ef4444',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            padding: '0.2rem 0.65rem',
                            borderRadius: '20px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                        }}
                    >
                        <XCircle size={12} />
                        <span>Failed</span>
                    </span>
                );
            default:
                return (
                    <span
                        style={{
                            background: 'rgba(245, 158, 11, 0.12)',
                            color: '#f59e0b',
                            border: '1px solid rgba(245, 158, 11, 0.3)',
                            padding: '0.2rem 0.65rem',
                            borderRadius: '20px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                        }}
                    >
                        <Clock size={12} />
                        <span>{status || 'Pending'}</span>
                    </span>
                );
        };
    };

    return (
        <div
            style={{
                background: 'rgba(15, 20, 34, 0.75)',
                backdropFilter: 'blur(12px)',
                borderRadius: '24px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                padding: '1.75rem',
                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.3)',
            }}
        >
            {/* Header Controls & Tabs */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                {/* Tabs */}
                <div
                    style={{
                        display: 'flex',
                        background: 'rgba(10, 14, 26, 0.7)',
                        padding: '0.35rem',
                        borderRadius: '16px',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                    }}
                >
                    <button
                        type="button"
                        onClick={() => handleTabChange('deposit')}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.6rem 1.4rem',
                            borderRadius: '12px',
                            fontSize: '0.88rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            background: activeTab === 'deposit' ? 'var(--solana-gradient)' : 'transparent',
                            color: activeTab === 'deposit' ? '#ffffff' : '#94a3b8',
                            border: 'none',
                        }}
                    >
                        <ArrowDownLeft size={16} style={{ color: activeTab === 'deposit' ? '#14F195' : '#94a3b8' }} />
                        <span>All User Deposits</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => handleTabChange('withdraw')}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.6rem 1.4rem',
                            borderRadius: '12px',
                            fontSize: '0.88rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            background: activeTab === 'withdraw' ? 'var(--solana-gradient)' : 'transparent',
                            color: activeTab === 'withdraw' ? '#ffffff' : '#94a3b8',
                            border: 'none',
                        }}
                    >
                        <ArrowUpRight size={16} style={{ color: activeTab === 'withdraw' ? '#14F195' : '#94a3b8' }} />
                        <span>All User Withdrawals</span>
                    </button>
                </div>

                {/* Refresh button */}
                <button
                    type="button"
                    onClick={fetchAdminTransactions}
                    disabled={loading}
                    style={{
                        background: 'rgba(255, 255, 255, 0.06)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        color: '#cbd5e1',
                        padding: '0.55rem 1rem',
                        borderRadius: '12px',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                    }}
                >
                    <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
                    <span>Refresh Data</span>
                </button>
            </div>

            {/* Filters Bar: Search & Status Dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                {/* Search Input */}
                <div style={{ position: 'relative', flex: 1, minWidth: '260px' }}>
                    <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search by User Email, Tx Signature, Memo, ID..."
                        style={{
                            width: '100%',
                            background: 'rgba(10, 14, 26, 0.7)',
                            border: '1px solid rgba(255, 255, 255, 0.12)',
                            borderRadius: '12px',
                            padding: '0.65rem 1rem 0.65rem 2.6rem',
                            color: '#ffffff',
                            fontSize: '0.85rem',
                            outline: 'none',
                        }}
                    />
                </div>

                {/* Status Select */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Filter size={16} style={{ color: '#94a3b8' }} />
                    <select
                        value={statusFilter}
                        onChange={handleStatusFilterChange}
                        style={{
                            background: 'rgba(10, 14, 26, 0.7)',
                            border: '1px solid rgba(255, 255, 255, 0.12)',
                            borderRadius: '12px',
                            padding: '0.65rem 1rem',
                            color: '#ffffff',
                            fontSize: '0.85rem',
                            outline: 'none',
                            cursor: 'pointer',
                        }}
                    >
                        <option value="ALL">All Statuses</option>
                        <option value="CONFIRMED">Confirmed</option>
                        <option value="PENDING">Pending</option>
                        <option value="FAILED">Failed</option>
                    </select>
                </div>

                {/* Limit Selector */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#94a3b8', fontSize: '0.82rem' }}>
                    <span>Per page:</span>
                    <select
                        value={pagination.limit}
                        onChange={handleLimitChange}
                        style={{
                            background: 'rgba(10, 14, 26, 0.7)',
                            border: '1px solid rgba(255, 255, 255, 0.12)',
                            borderRadius: '10px',
                            padding: '0.45rem 0.6rem',
                            color: '#ffffff',
                            fontSize: '0.82rem',
                            outline: 'none',
                        }}
                    >
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                    </select>
                </div>
            </div>

            {/* Table Container */}
            <div style={{ overflowX: 'auto', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                    <thead>
                        <tr style={{ background: 'rgba(10, 14, 26, 0.9)', color: '#94a3b8', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                            <th style={{ padding: '0.9rem 1rem' }}>User Email</th>
                            <th style={{ padding: '0.9rem 1rem' }}>ID / Memo</th>
                            <th style={{ padding: '0.9rem 1rem' }}>Amount (SOL)</th>
                            <th style={{ padding: '0.9rem 1rem' }}>{activeTab === 'deposit' ? 'Platform Address' : 'To Recipient Address'}</th>
                            <th style={{ padding: '0.9rem 1rem' }}>Tx Signature</th>
                            <th style={{ padding: '0.9rem 1rem' }}>Status</th>
                            <th style={{ padding: '0.9rem 1rem' }}>Date & Time</th>
                            <th style={{ padding: '0.9rem 1rem', textAlign: 'center' }}>Details</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={8} style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                                    <div className="w-8 h-8 border-3 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                                    <span>Fetching transactions...</span>
                                </td>
                            </tr>
                        ) : items.length === 0 ? (
                            <tr>
                                <td colSpan={8} style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                                    No {activeTab} transactions found.
                                </td>
                            </tr>
                        ) : (
                            items.map((item) => {
                                const id = item.depositId || item.withdrawId || item._id;
                                const userEmail = item.userId?.email || 'N/A';
                                const userName = item.userId?.fullName || '';
                                const txSig = item.transactionSignature;
                                const targetAddr = item.platformAddress || item.toAddress || 'N/A';

                                return (
                                    <tr
                                        key={item._id}
                                        style={{
                                            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                                            transition: 'background 0.15s ease',
                                        }}
                                        className="hover:bg-white/5"
                                    >
                                        {/* User Info */}
                                        <td style={{ padding: '0.9rem 1rem' }}>
                                            <div style={{ color: '#ffffff', fontWeight: 600 }}>{userEmail}</div>
                                            {userName && <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>{userName}</div>}
                                        </td>

                                        {/* ID & Memo */}
                                        <td style={{ padding: '0.9rem 1rem' }}>
                                            <div style={{ color: '#cbd5e1', fontFamily: 'monospace', fontSize: '0.8rem' }}>{id}</div>
                                            <div style={{ color: '#14F195', fontWeight: 700, fontSize: '0.78rem' }}>Memo: {item.memo}</div>
                                        </td>

                                        {/* Amount */}
                                        <td style={{ padding: '0.9rem 1rem', fontWeight: 800, color: activeTab === 'deposit' ? '#14F195' : '#9945FF' }}>
                                            {activeTab === 'deposit' ? '+' : '-'}{item.amount} SOL
                                        </td>

                                        {/* Target Address */}
                                        <td style={{ padding: '0.9rem 1rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                                <span style={{ fontFamily: 'monospace', color: '#cbd5e1', fontSize: '0.78rem' }}>
                                                    {targetAddr.length > 12 ? `${targetAddr.slice(0, 6)}...${targetAddr.slice(-6)}` : targetAddr}
                                                </span>
                                                <CopyButton text={targetAddr} />
                                            </div>
                                        </td>

                                        {/* Tx Signature */}
                                        <td style={{ padding: '0.9rem 1rem' }}>
                                            {txSig ? (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                                    <span style={{ fontFamily: 'monospace', color: '#94a3b8', fontSize: '0.78rem' }}>
                                                        {`${txSig.slice(0, 6)}...${txSig.slice(-6)}`}
                                                    </span>
                                                    <CopyButton text={txSig} />
                                                    <a
                                                        href={`https://explorer.solana.com/tx/${txSig}?cluster=devnet`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        style={{ color: '#9945FF' }}
                                                    >
                                                        <ExternalLink size={13} />
                                                    </a>
                                                </div>
                                            ) : (
                                                <span style={{ color: '#64748b', fontSize: '0.78rem' }}>-</span>
                                            )}
                                        </td>

                                        {/* Status */}
                                        <td style={{ padding: '0.9rem 1rem' }}>
                                            {getStatusBadge(item.status)}
                                        </td>

                                        {/* Date */}
                                        <td style={{ padding: '0.9rem 1rem', color: '#94a3b8', fontSize: '0.78rem' }}>
                                            {moment(item.createdAt).format('MMM DD, YYYY HH:mm')}
                                        </td>

                                        {/* View Details Modal Button */}
                                        <td style={{ padding: '0.9rem 1rem', textAlign: 'center' }}>
                                            {txSig ? (
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedTxSig(txSig)}
                                                    style={{
                                                        background: 'rgba(153, 69, 255, 0.15)',
                                                        border: '1px solid rgba(153, 69, 255, 0.3)',
                                                        color: '#ffffff',
                                                        padding: '0.35rem 0.6rem',
                                                        borderRadius: '8px',
                                                        cursor: 'pointer',
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '0.3rem',
                                                        fontSize: '0.75rem',
                                                        fontWeight: 600,
                                                    }}
                                                >
                                                    <Eye size={13} />
                                                    <span>Decode</span>
                                                </button>
                                            ) : (
                                                <span style={{ color: '#64748b', fontSize: '0.75rem' }}>-</span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
                <span style={{ color: '#94a3b8', fontSize: '0.82rem' }}>
                    Showing Page <strong style={{ color: '#ffffff' }}>{pagination.currentPage}</strong> of <strong style={{ color: '#ffffff' }}>{pagination.totalPages}</strong> ({pagination.totalCount} total items)
                </span>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button
                        type="button"
                        onClick={() => setPagination((prev) => ({ ...prev, currentPage: Math.max(1, prev.currentPage - 1) }))}
                        disabled={pagination.currentPage <= 1 || loading}
                        style={{
                            background: 'rgba(255, 255, 255, 0.06)',
                            border: '1px solid rgba(255, 255, 255, 0.12)',
                            color: '#ffffff',
                            padding: '0.5rem 0.9rem',
                            borderRadius: '10px',
                            cursor: pagination.currentPage <= 1 || loading ? 'not-allowed' : 'pointer',
                            opacity: pagination.currentPage <= 1 || loading ? 0.5 : 1,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            fontSize: '0.82rem',
                            fontWeight: 600,
                        }}
                    >
                        <ChevronLeft size={16} />
                        <span>Previous</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setPagination((prev) => ({ ...prev, currentPage: Math.min(prev.totalPages, prev.currentPage + 1) }))}
                        disabled={pagination.currentPage >= pagination.totalPages || loading}
                        style={{
                            background: 'rgba(255, 255, 255, 0.06)',
                            border: '1px solid rgba(255, 255, 255, 0.12)',
                            color: '#ffffff',
                            padding: '0.5rem 0.9rem',
                            borderRadius: '10px',
                            cursor: pagination.currentPage >= pagination.totalPages || loading ? 'not-allowed' : 'pointer',
                            opacity: pagination.currentPage >= pagination.totalPages || loading ? 0.5 : 1,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            fontSize: '0.82rem',
                            fontWeight: 600,
                        }}
                    >
                        <span>Next</span>
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>

            {/* Transaction Decoder Modal */}
            {selectedTxSig && (
                <TransactionDecoderModal
                    signature={selectedTxSig}
                    onClose={() => setSelectedTxSig(null)}
                />
            )}
        </div>
    );
};
