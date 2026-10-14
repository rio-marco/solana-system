'use client';

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import moment from 'moment';
import Link from 'next/link';
import {
    Search,
    ChevronLeft,
    ChevronRight,
    CheckCircle2,
    XCircle,
    Clock,
    ShieldOff,
    ShieldCheck,
    X,
    AlertTriangle,
    Users,
    Eye,
    RefreshCw,
    Filter,
    History,
} from 'lucide-react';
import {
    USER_STATUS,
    TWOFA_STATUS,
    DEFAULT_CURRENT_PAGE,
    DEFAULT_ITEM_PER_PAGE,
} from './ui-constants.mjs';

function getStatusBadge(status) {
    if (status === USER_STATUS.ACTIVE) {
        return (
            <span style={{ background: 'rgba(20,241,149,0.12)', color: '#0D6EFD', border: '1px solid rgba(20,241,149,0.3)', padding: '0.2rem 0.65rem', borderRadius: '20px', fontSize: '0.73rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                <CheckCircle2 size={11} /> Active
            </span>
        );
    };

    if (status === USER_STATUS.SUSPENDED) {
        return (
            <span style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', padding: '0.2rem 0.65rem', borderRadius: '20px', fontSize: '0.73rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                <ShieldOff size={11} /> Suspended
            </span>
        );
    };

    return (
        <span style={{ background: 'rgba(245,158,11,0.12)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)', padding: '0.2rem 0.65rem', borderRadius: '20px', fontSize: '0.73rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
            <Clock size={11} /> Inactive
        </span>
    );
};

function getTwoFABadge(twoFAStatus) {
    if (twoFAStatus === TWOFA_STATUS.ENABLED) {
        return (
            <span style={{ background: 'rgba(153,69,255,0.12)', color: '#9945FF', border: '1px solid rgba(153,69,255,0.3)', padding: '0.2rem 0.55rem', borderRadius: '20px', fontSize: '0.73rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                <ShieldCheck size={11} /> ON
            </span>
        );
    };

    return (
        <span style={{ background: 'rgba(100,116,139,0.12)', color: '#64748b', border: '1px solid rgba(100,116,139,0.2)', padding: '0.2rem 0.55rem', borderRadius: '20px', fontSize: '0.73rem', fontWeight: 700 }}>
            OFF
        </span>
    );
};

// Suspend Modal
function SuspendModal({ user, onConfirm, onClose, loading }) {
    const [reason, setReason] = useState('');

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <div style={{ background: '#0f1422', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '6px', width: '100%', maxWidth: '480px', padding: '2rem', boxShadow: '0 25px 60px rgba(0,0,0,0.7)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <AlertTriangle size={20} style={{ color: '#ef4444' }} />
                        </div>
                        <div>
                            <h3 style={{ color: '#212529', fontWeight: 800, fontSize: '1.05rem', margin: 0 }}>Suspend User</h3>
                            <p style={{ color: '#94a3b8', fontSize: '0.78rem', margin: 0 }}>{user?.email}</p>
                        </div>
                    </div>
                    <button type="button" onClick={onClose} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', padding: '0.4rem', borderRadius: '8px', cursor: 'pointer' }}>
                        <X size={16} />
                    </button>
                </div>

                <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '12px', padding: '0.85rem 1rem', marginBottom: '1.25rem' }}>
                    <p style={{ color: '#fca5a5', fontSize: '0.83rem', margin: 0, lineHeight: 1.5 }}>
                        This will immediately restrict the user&apos;s access to the platform. Please provide a reason for suspension.
                    </p>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                        Suspension Reason <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Enter reason for suspension (e.g., Suspicious activity, Terms violation...)"
                        rows={3}
                        style={{
                            width: '100%',
                            background: 'rgba(7,9,14,0.8)',
                            border: '1px solid rgba(255,255,255,0.12)',
                            borderRadius: '12px',
                            padding: '0.75rem 1rem',
                            color: '#212529',
                            fontSize: '0.88rem',
                            outline: 'none',
                            resize: 'vertical',
                            fontFamily: 'inherit',
                            minHeight: '80px',
                        }}
                    />
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button
                        type="button"
                        onClick={onClose}
                        style={{ flex: 1, padding: '0.75rem', borderRadius: '12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', fontWeight: 600, cursor: 'pointer', fontSize: '0.88rem' }}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={() => onConfirm(reason)}
                        disabled={loading || reason.trim().length < 3}
                        style={{ flex: 1, padding: '0.75rem', borderRadius: '12px', background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', border: 'none', color: '#212529', fontWeight: 700, cursor: reason.trim().length < 3 || loading ? 'not-allowed' : 'pointer', fontSize: '0.88rem', opacity: reason.trim().length < 3 || loading ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                    >
                        <ShieldOff size={15} />
                        {loading ? 'Suspending...' : 'Confirm Suspend'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// Suspend History Modal
function SuspendHistoryModal({ user, onClose }) {
    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <div style={{ background: '#0f1422', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', width: '100%', maxWidth: '520px', maxHeight: '80vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 60px rgba(0,0,0,0.7)' }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid #DEE2E6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <History size={20} style={{ color: '#9945FF' }} />
                        <div>
                            <h3 style={{ color: '#212529', fontWeight: 800, fontSize: '1rem', margin: 0 }}>Suspend History</h3>
                            <p style={{ color: '#94a3b8', fontSize: '0.75rem', margin: 0 }}>{user?.email}</p>
                        </div>
                    </div>
                    <button type="button" onClick={onClose} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', padding: '0.4rem', borderRadius: '8px', cursor: 'pointer' }}>
                        <X size={16} />
                    </button>
                </div>
                <div style={{ padding: '1.25rem', overflowY: 'auto', flex: 1 }}>
                    {(!user?.suspendHistory || user.suspendHistory.length === 0) ? (
                        <div style={{ textAlign: 'center', color: '#64748b', padding: '2rem', fontSize: '0.88rem' }}>
                            No suspension history found.
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {[...user.suspendHistory].reverse().map((entry, i) => (
                                <div key={i} style={{ background: 'rgba(10,14,26,0.6)', borderRadius: '12px', padding: '0.9rem 1rem', border: '1px solid rgba(255,255,255,0.07)' }}>
                                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                        <span style={{ color: '#fca5a5', fontSize: '0.8rem', fontWeight: 600 }}>Reason:</span>
                                        <span style={{ color: '#cbd5e1', fontSize: '0.82rem', textAlign: 'right', flex: 1 }}>{entry.reason}</span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: '#64748b', flexWrap: 'wrap' }}>
                                        <span>🔴 Suspended: {moment(entry.suspendedAt).format('MMM DD, YYYY HH:mm')}</span>
                                        {entry.activatedAt && (
                                            <span>🟢 Activated: {moment(entry.activatedAt).format('MMM DD, YYYY HH:mm')}</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export function UserManagement() {
    const [loading, setLoading] = useState(false);
    const [users, setUsers] = useState([]);
    const [pagination, setPagination] = useState({
        totalCount: 0,
        totalPages: 0,
        currentPage: DEFAULT_CURRENT_PAGE,
        limit: DEFAULT_ITEM_PER_PAGE,
    });

    // Filters
    const [nameFilter, setNameFilter] = useState('');
    const [emailFilter, setEmailFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [twoFAFilter, setTwoFAFilter] = useState('ALL');

    const [debouncedName, setDebouncedName] = useState('');
    const [debouncedEmail, setDebouncedEmail] = useState('');

    // Modals
    const [suspendModal, setSuspendModal] = useState(null);
    const [historyModal, setHistoryModal] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        const t = setTimeout(() => {
            setDebouncedName(nameFilter);
            setPagination(p => ({ ...p, currentPage: DEFAULT_CURRENT_PAGE }));
        }, 350);

        return () => clearTimeout(t);
    }, [nameFilter]);

    useEffect(() => {
        const t = setTimeout(() => {
            setDebouncedEmail(emailFilter);
            setPagination(p => ({ ...p, currentPage: DEFAULT_CURRENT_PAGE }));
        }, 350);

        return () => clearTimeout(t);
    }, [emailFilter]);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const params = {
                page: pagination.currentPage,
                limit: pagination.limit,
                name: debouncedName,
                email: debouncedEmail,
                status: statusFilter,
                twoFAStatus: twoFAFilter,
            };

            const res = await axios.get('/api/admin/users', { params });
            if (res.data?.flag && res.data?.data) {
                const d = res.data.data;
                setUsers(d.users || []);
                setPagination(p => ({ ...p, totalCount: d.totalCount || 0, totalPages: d.totalPages || 0 }));
            } else {
                setUsers([]);
            };
        } catch (err) {
            console.error('Failed to fetch users:', err);
            setUsers([]);
        } finally {
            setLoading(false);
        };
    }, [pagination.currentPage, pagination.limit, debouncedName, debouncedEmail, statusFilter, twoFAFilter]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleStatusChange = (e) => {
        setStatusFilter(e.target.value);
        setPagination(p => ({ ...p, currentPage: DEFAULT_CURRENT_PAGE }));
    };

    const handleTwoFAChange = (e) => {
        setTwoFAFilter(e.target.value);
        setPagination(p => ({ ...p, currentPage: DEFAULT_CURRENT_PAGE }));
    };

    const handleLimitChange = (e) => {
        setPagination(p => ({ ...p, limit: parseInt(e.target.value, 10), currentPage: DEFAULT_CURRENT_PAGE }));
    };

    const handlePageChange = (pg) => {
        if (pg >= 1 && pg <= pagination.totalPages && !loading) {
            setPagination(p => ({ ...p, currentPage: pg }));
        };
    };

    const handleConfirmSuspend = async (reason) => {
        if (!suspendModal) return;

        setActionLoading(true);

        try {
            const payload = {
                action: USER_STATUS.SUSPENDED,
                reason,
            };
            const res = await axios.patch(`/api/admin/users/${suspendModal._id}/status`, payload);
            if (res.data?.flag) {
                setUsers(prev => prev.map(u => u._id === suspendModal._id ? res.data.data.user : u));
                setSuspendModal(null);
            };
        } catch (err) {
            console.error('Failed to suspend user:', err);
        } finally {
            setActionLoading(false);
        };
    };

    const handleActivate = async (user) => {
        setActionLoading(true);
        try {
            const payload = {
                action: USER_STATUS.ACTIVE
            };

            const res = await axios.patch(`/api/admin/users/${user._id}/status`, payload);
            if (res.data?.flag) {
                setUsers(prev => prev.map(u => u._id === user._id ? res.data.data.user : u));
            };
        } catch (err) {
            console.error('Failed to activate user:', err);
        } finally {
            setActionLoading(false);
        };
    };

    const getPageNumbers = () => {
        const pages = [];
        const total = pagination.totalPages;
        const cur = pagination.currentPage;
        if (total <= 7) {
            for (let i = 1; i <= total; i++) pages.push(i);
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

    const startEntry = pagination.totalCount === 0 ? 0 : (pagination.currentPage - 1) * pagination.limit + 1;
    const endEntry = Math.min(pagination.currentPage * pagination.limit, pagination.totalCount);

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
            {/* Header */}
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#9945FF', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem' }}>
                        <Users size={16} /> User Management
                    </div>
                    <h1 style={{ color: '#212529', fontSize: '1.6rem', fontWeight: 900, margin: 0 }}>All Platform Users</h1>
                </div>
                <button
                    type="button"
                    onClick={fetchUsers}
                    disabled={loading}
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#212529', padding: '0.6rem 1.25rem', borderRadius: '12px', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: 700 }}
                >
                    <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Refresh
                </button>
            </div>

            {/* Main Card */}
            <div style={{ background: '#FFFFFF', borderRadius: '6px', border: '1px solid #DEE2E6', padding: '1.75rem', boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1), 0 1px 2px 0 rgba(0,0,0,0.06)' }}>
                {/* Filters */}
                <div style={{ display: 'flex', gap: '0.85rem', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    {/* Name Search */}
                    <div style={{ position: 'relative', flex: 1, minWidth: '180px' }}>
                        <Search size={14} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                        <input
                            type="text"
                            value={nameFilter}
                            onChange={(e) => setNameFilter(e.target.value)}
                            placeholder="Search by name..."
                            style={{ width: '100%', ...selectStyle, paddingLeft: '2.4rem' }}
                        />
                    </div>
                    {/* Email Search */}
                    <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
                        <Search size={14} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                        <input
                            type="text"
                            value={emailFilter}
                            onChange={(e) => setEmailFilter(e.target.value)}
                            placeholder="Search by email..."
                            style={{ width: '100%', ...selectStyle, paddingLeft: '2.4rem' }}
                        />
                    </div>
                    {/* Status Filter */}
                    <select value={statusFilter} onChange={handleStatusChange} style={selectStyle}>
                        <option value="ALL">All Status</option>
                        <option value={USER_STATUS.ACTIVE}>Active</option>
                        <option value={USER_STATUS.SUSPENDED}>Suspended</option>
                        <option value={USER_STATUS.INACTIVE}>Inactive</option>
                    </select>
                    {/* 2FA Filter */}
                    <select value={twoFAFilter} onChange={handleTwoFAChange} style={selectStyle}>
                        <option value="ALL">All 2FA</option>
                        <option value={TWOFA_STATUS.ENABLED}>ON</option>
                        <option value={TWOFA_STATUS.DISABLED}>OFF</option>
                    </select>
                    {/* Per page */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#94a3b8', fontSize: '0.8rem' }}>
                        <span>Per page:</span>
                        <select
                            value={pagination.limit}
                            onChange={handleLimitChange}
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
                                <th style={{ padding: '0.9rem 1rem', fontWeight: 600 }}>User</th>
                                <th style={{ padding: '0.9rem 1rem', fontWeight: 600 }}>Wallet Balance</th>
                                <th style={{ padding: '0.9rem 1rem', fontWeight: 600 }}>Status</th>
                                <th style={{ padding: '0.9rem 1rem', fontWeight: 600 }}>Joined</th>
                                <th style={{ padding: '0.9rem 1rem', fontWeight: 600, textAlign: 'center' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                                        <div style={{ width: '32px', height: '32px', border: '3px solid rgba(153,69,255,0.3)', borderTop: '3px solid #9945FF', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 0.75rem' }} />
                                        <span>Fetching users...</span>
                                    </td>
                                </tr>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                                        No users found matching your criteria.
                                    </td>
                                </tr>
                            ) : users.map((user) => (
                                <tr
                                    key={user._id}
                                    style={{ borderBottom: '1px solid #DEE2E6', transition: 'background 0.15s' }}
                                    className="hover:bg-gray-50"
                                >
                                    {/* User Info */}
                                    <td style={{ padding: '0.85rem 1rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            {user.profilePhoto ? (
                                                <img
                                                    src={user.profilePhoto}
                                                    alt={user.fullName}
                                                    style={{ width: '36px', height: '36px', borderRadius: '10px', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)', flexShrink: 0 }}
                                                    onError={(e) => { e.target.style.display = 'none'; }}
                                                />
                                            ) : (
                                                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, rgba(153,69,255,0.3), rgba(0,194,255,0.3))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 800, color: '#212529', flexShrink: 0 }}>
                                                    {user.fullName?.[0]?.toUpperCase() || '?'}
                                                </div>
                                            )}
                                            <div>
                                                <div style={{ color: '#212529', fontWeight: 700, fontSize: '0.88rem' }}>{user.fullName}</div>
                                                <div style={{ color: '#64748b', fontSize: '0.75rem' }}>{user.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    {/* Wallet Balance */}
                                    <td style={{ padding: '0.85rem 1rem', fontWeight: 800, color: '#00C2FF' }}>
                                        {(user.walletBalance || 0).toFixed(6)} <span style={{ color: '#64748b', fontWeight: 600, fontSize: '0.75rem' }}>SOL</span>
                                    </td>
                                    {/* Status */}
                                    <td style={{ padding: '0.85rem 1rem' }}>
                                        {getStatusBadge(user.status)}
                                    </td>
                                    {/* Joined */}
                                    <td style={{ padding: '0.85rem 1rem', color: '#64748b', fontSize: '0.78rem' }}>
                                        {moment(user.createdAt).format('MMM DD, YYYY')}
                                    </td>
                                    {/* Actions */}
                                    <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                                            {/* History */}
                                            <Link
                                                href={`/user/${user._id}`}
                                                title="View User Details"
                                                style={{
                                                    background: '#E7F1FF',
                                                    border: '1px solid #9EC5FE',
                                                    color: '#0D6EFD',
                                                    padding: '0.35rem 0.55rem',
                                                    borderRadius: '6px',
                                                    cursor: 'pointer',
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '0.25rem',
                                                    fontSize: '0.73rem',
                                                    fontWeight: 600,
                                                    textDecoration: 'none',
                                                }}
                                            >
                                                <Eye size={13} /> View Details
                                            </Link>
                                            {/* Suspend / Activate */}
                                            {user.status === USER_STATUS.SUSPENDED ? (
                                                <button
                                                    type="button"
                                                    onClick={() => handleActivate(user)}
                                                    disabled={actionLoading}
                                                    style={{ background: 'rgba(20,241,149,0.12)', border: '1px solid rgba(20,241,149,0.25)', color: '#0D6EFD', padding: '0.35rem 0.7rem', borderRadius: '8px', cursor: actionLoading ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.73rem', fontWeight: 700 }}
                                                >
                                                    <ShieldCheck size={13} /> Activate
                                                </button>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() => setSuspendModal(user)}
                                                    disabled={actionLoading}
                                                    style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', color: '#ef4444', padding: '0.35rem 0.7rem', borderRadius: '8px', cursor: actionLoading ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.73rem', fontWeight: 700 }}
                                                >
                                                    <ShieldOff size={13} /> Suspend
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {pagination.totalCount > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.08)', flexWrap: 'wrap', gap: '1rem' }}>
                        <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                            Showing <strong style={{ color: '#212529' }}>{startEntry}</strong> to <strong style={{ color: '#212529' }}>{endEntry}</strong> of <strong style={{ color: '#212529' }}>{pagination.totalCount}</strong> users
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <button
                                type="button"
                                onClick={() => handlePageChange(pagination.currentPage - 1)}
                                disabled={pagination.currentPage <= 1 || loading}
                                style={{
                                    width: '36px',
                                    height: '36px',
                                    borderRadius: '10px',
                                    background: '#F5F9FC',
                                    border: '1px solid #D8DFE4',
                                    color: pagination.currentPage <= 1 ? '#cbd5e1' : '#475569',
                                    cursor: pagination.currentPage <= 1 ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <ChevronLeft size={16} />
                            </button>
                            {getPageNumbers().map((p, idx) => (
                                p === '...'
                                    ? <span
                                        key={`e-${idx}`}
                                        style={{
                                            width: '32px',
                                            textAlign: 'center',
                                            color: '#cbd5e1'
                                        }}
                                    >...</span>
                                    :
                                    <button
                                        key={`p-${p}`}
                                        type="button"
                                        onClick={() => handlePageChange(p)}
                                        disabled={loading || p === pagination.currentPage}
                                        style={{
                                            minWidth: '36px',
                                            height: '36px',
                                            padding: '0 0.5rem',
                                            borderRadius: '10px',
                                            fontSize: '0.85rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            background: p === pagination.currentPage ? 'rgb(13, 110, 253)' : '#F5F9FC',
                                            color: p === pagination.currentPage ? '#FFFFFF' : '#212529',
                                            border: p === pagination.currentPage ? 'none' : '1px solid #D8DFE4',
                                            fontWeight: p === pagination.currentPage ? 800 : 500,
                                            cursor: p === pagination.currentPage ? 'default' : 'pointer',
                                        }}
                                    >
                                        {p}
                                    </button>
                            ))}
                            <button
                                type="button"
                                onClick={() => handlePageChange(pagination.currentPage + 1)}
                                disabled={pagination.currentPage >= pagination.totalPages || loading}
                                style={{
                                    width: '36px',
                                    height: '36px',
                                    borderRadius: '10px',
                                    background: '#F5F9FC',
                                    border: '1px solid #D8DFE4',
                                    color: pagination.currentPage >= pagination.totalPages ? '#cbd5e1' : '#475569',
                                    cursor: pagination.currentPage >= pagination.totalPages ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modals */}
            {suspendModal && (
                <SuspendModal
                    user={suspendModal}
                    onConfirm={handleConfirmSuspend}
                    onClose={() => setSuspendModal(null)}
                    loading={actionLoading}
                />
            )}
            {historyModal && (
                <SuspendHistoryModal
                    user={historyModal}
                    onClose={() => setHistoryModal(null)}
                />
            )}
        </div>
    );
};