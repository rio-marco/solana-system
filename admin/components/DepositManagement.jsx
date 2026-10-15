'use client';

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import moment from 'moment';
import { CopyButton } from '../lib/clipboard';
import { TransactionDecoderModal } from './TransactionDecoderModal';
import {
    ArrowDownLeft,
    Search,
    ExternalLink,
    Clock,
    CheckCircle2,
    XCircle,
    Eye,
    RefreshCw,
} from 'lucide-react';
import {
    DEPOSIT_STATUS,
    DEFAULT_CURRENT_PAGE,
    DEFAULT_ITEM_PER_PAGE,
} from './ui-constants.mjs';
import { Pagination } from './Pagination';

function getStatusBadge(status) {
    switch (status) {
        case DEPOSIT_STATUS.CONFIRMED:
            return <span style={{ background: 'rgba(20,241,149,0.12)', color: '#0D6EFD', border: '1px solid rgba(20,241,149,0.3)', padding: '0.2rem 0.65rem', borderRadius: '20px', fontSize: '0.73rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><CheckCircle2 size={11} />Confirmed</span>;
        case DEPOSIT_STATUS.FAILED:
            return <span style={{ background: '#F8D7DA', color: '#DC3545', border: '1px solid #F1AEB5', padding: '0.2rem 0.65rem', borderRadius: '20px', fontSize: '0.73rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><XCircle size={11} />Failed</span>;
        default:
            return <span style={{ background: '#FFF3CD', color: '#664D03', border: '1px solid #FFE69C', padding: '0.2rem 0.65rem', borderRadius: '20px', fontSize: '0.73rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><Clock size={11} />{status || 'Pending'}</span>;
    };
};

export function DepositManagement() {
    const [loading, setLoading] = useState(false);
    const [items, setItems] = useState([]);
    const [pagination, setPagination] = useState({
        totalCount: 0,
        totalPages: 0,
        currentPage: DEFAULT_CURRENT_PAGE,
        limit: DEFAULT_ITEM_PER_PAGE,
    });
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [selectedTxSig, setSelectedTxSig] = useState(null);

    useEffect(() => {
        const t = setTimeout(() => {
            setDebouncedSearch(searchTerm);
            setPagination(p => ({ ...p, currentPage: DEFAULT_CURRENT_PAGE }));
        }, 350);

        return () => clearTimeout(t);
    }, [searchTerm]);

    const fetchDeposits = useCallback(async () => {
        setLoading(true);
        try {
            const payload = {
                page: pagination.currentPage,
                limit: pagination.limit,
                status: statusFilter,
                search: debouncedSearch,
            };

            const res = await axios.get('/api/admin/deposits', { params: payload, });
            if (res.data?.flag && res.data?.data) {
                const d = res.data.data;
                setItems(d.deposits || []);
                setPagination(p => ({ ...p, totalCount: d.totalCount || 0, totalPages: d.totalPages || 0 }));
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
        fetchDeposits();
    }, [fetchDeposits]);

    const handlePageChange = (pg) => {
        if (pg >= 1 && pg <= pagination.totalPages && !loading) {
            setPagination(p => ({ ...p, currentPage: pg }));
        };
    };

    const selectStyle = {
        background: '#FFFFFF',
        border: '1px solid #CED4DA',
        borderRadius: '12px',
        padding: '0.6rem 1rem',
        color: '#495057',
        fontSize: '0.83rem',
        outline: 'none',
        cursor: 'pointer',
    };

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
                    borderBottom: '1px solid #DEE2E6',
                }}
            >
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#0D6EFD', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem' }}>
                        <ArrowDownLeft size={16} /> Deposit Management
                    </div>
                    <h1 style={{ color: '#212529', fontSize: '1.6rem', fontWeight: 900, margin: 0 }}>All User Deposits</h1>
                </div>
                <button type="button" onClick={fetchDeposits} disabled={loading} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#212529', padding: '0.6rem 1.25rem', borderRadius: '6px', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: 700 }}>
                    <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Refresh
                </button>
            </div>

            <div style={{ background: '#FFFFFF', borderRadius: '6px', border: '1px solid #DEE2E6', padding: '1.75rem', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)' }}>
                {/* Filters */}
                <div style={{ display: 'flex', gap: '0.85rem', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <div style={{ position: 'relative', flex: 1, minWidth: '260px' }}>
                        <Search size={14} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#6C757D' }} />
                        <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search by email, tx signature, memo, ID..." style={{ width: '100%', ...selectStyle, paddingLeft: '2.4rem' }} />
                    </div>
                    <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPagination(p => ({ ...p, currentPage: DEFAULT_CURRENT_PAGE })); }} style={selectStyle}>
                        <option value="ALL">All Statuses</option>
                        <option value={DEPOSIT_STATUS.CONFIRMED}>Confirmed</option>
                        <option value={DEPOSIT_STATUS.PENDING}>Pending</option>
                        <option value={DEPOSIT_STATUS.FAILED}>Failed</option>
                    </select>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#6C757D', fontSize: '0.8rem' }}>
                        <span>Per page:</span>
                        <select
                            value={pagination.limit}
                            onChange={(e) => setPagination(p => ({ ...p, limit: parseInt(e.target.value, 10), currentPage: DEFAULT_CURRENT_PAGE }))}
                            style={{ ...selectStyle, padding: '0.45rem 0.65rem' }}
                        >
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                        </select>
                    </div>
                </div>

                {/* Table */}
                <div style={{ overflowX: 'auto', borderRadius: '16px', border: '1px solid #DEE2E6' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84rem' }}>
                        <thead>
                            <tr
                                style={{
                                    background: '#F5F9FC',
                                    color: '#171D25',
                                    borderBottom: '1px solid #D8DFE4'
                                }}
                            >
                                <th style={{ padding: '0.9rem 1rem', fontWeight: 600 }}>User Email</th>
                                <th style={{ padding: '0.9rem 1rem', fontWeight: 600 }}>ID / Memo</th>
                                <th style={{ padding: '0.9rem 1rem', fontWeight: 600 }}>Amount (SOL)</th>
                                <th style={{ padding: '0.9rem 1rem', fontWeight: 600 }}>Platform Address</th>
                                <th style={{ padding: '0.9rem 1rem', fontWeight: 600 }}>Tx Signature</th>
                                <th style={{ padding: '0.9rem 1rem', fontWeight: 600 }}>Status</th>
                                <th style={{ padding: '0.9rem 1rem', fontWeight: 600 }}>Date & Time</th>
                                <th style={{ padding: '0.9rem 1rem', fontWeight: 600, textAlign: 'center' }}>Details</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={8} style={{ padding: '3rem', textAlign: 'center', color: '#6C757D' }}>
                                        <div style={{ width: '32px', height: '32px', border: '3px solid rgba(20,241,149,0.2)', borderTop: '3px solid #14F195', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 0.75rem' }} />
                                        <span>Fetching deposits...</span>
                                    </td>
                                </tr>
                            ) : items.length === 0 ? (
                                <tr>
                                    <td colSpan={8} style={{ padding: '3rem', textAlign: 'center', color: '#6C757D' }}>
                                        No deposit transactions found.
                                    </td>
                                </tr>
                            ) : items.map((item) => {
                                const id = item.depositId || item._id;
                                const userEmail = item.userId?.email || 'N/A';
                                const userName = item.userId?.fullName || '';
                                const txSig = item.transactionSignature;
                                const targetAddr = item.platformAddress || 'N/A';
                                return (
                                    <tr key={item._id} style={{ borderBottom: '1px solid #DEE2E6', transition: 'background 0.15s' }} className="hover:bg-gray-50">
                                        <td style={{ padding: '0.85rem 1rem' }}>
                                            <div style={{ color: '#212529', fontWeight: 600 }}>{userEmail}</div>
                                            {userName && <div style={{ color: '#6C757D', fontSize: '0.75rem' }}>{userName}</div>}
                                        </td>
                                        <td style={{ padding: '0.85rem 1rem' }}>
                                            <div style={{ color: '#6C757D', fontFamily: 'monospace', fontSize: '0.78rem' }}>{id}</div>
                                            <div style={{ color: '#0D6EFD', fontWeight: 700, fontSize: '0.75rem' }}>Memo: {item.memo}</div>
                                        </td>
                                        <td style={{ padding: '0.85rem 1rem', fontWeight: 800, color: '#0D6EFD' }}>+{item.amount} SOL</td>
                                        <td style={{ padding: '0.85rem 1rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                                <span style={{ fontFamily: 'monospace', color: '#6C757D', fontSize: '0.75rem' }}>{targetAddr.length > 12 ? `${targetAddr.slice(0, 6)}...${targetAddr.slice(-6)}` : targetAddr}</span>
                                                <CopyButton text={targetAddr} />
                                            </div>
                                        </td>
                                        <td style={{ padding: '0.85rem 1rem' }}>
                                            {txSig ? (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                                    <span style={{ fontFamily: 'monospace', color: '#6C757D', fontSize: '0.75rem' }}>{`${txSig.slice(0, 6)}...${txSig.slice(-6)}`}</span>
                                                    <CopyButton text={txSig} />
                                                    <a href={`https://explorer.solana.com/tx/${txSig}?cluster=devnet`} target="_blank" rel="noopener noreferrer" style={{ color: '#9945FF' }}><ExternalLink size={12} /></a>
                                                </div>
                                            ) : <span style={{ color: '#475569', fontSize: '0.75rem' }}>—</span>}
                                        </td>
                                        <td style={{ padding: '0.85rem 1rem' }}>{getStatusBadge(item.status)}</td>
                                        <td style={{ padding: '0.85rem 1rem', color: '#6C757D', fontSize: '0.75rem' }}>{moment(item.createdAt).format('MMM DD, YYYY HH:mm')}</td>
                                        <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                                            {txSig ? (
                                                <button type="button" onClick={() => setSelectedTxSig(txSig)} style={{ background: 'rgba(153,69,255,0.15)', border: '1px solid rgba(153,69,255,0.3)', color: '#212529', padding: '0.35rem 0.6rem', borderRadius: '8px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.73rem', fontWeight: 600 }}>
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
                <Pagination
                    currentPage={pagination.currentPage}
                    totalPages={pagination.totalPages}
                    totalCount={pagination.totalCount}
                    limit={pagination.limit}
                    onPageChange={handlePageChange}
                    loading={loading}
                    itemLabel="entries"
                />
            </div>

            {selectedTxSig && <TransactionDecoderModal signature={selectedTxSig} onClose={() => setSelectedTxSig(null)} />}
        </div>
    );
};