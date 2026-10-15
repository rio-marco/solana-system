'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import axios from 'axios';
import moment from 'moment';
import { useToast } from '../context/ToastContext';
import { CopyButton } from '../lib/clipboard';
import {
    ArrowLeft,
    User,
    History,
    Activity,
    CheckCircle2,
    ShieldOff,
    Clock,
    ShieldCheck,
    ChevronLeft,
    ChevronRight,
    ExternalLink,
} from 'lucide-react';
import {
    USER_STATUS,
    TWOFA_STATUS,
    DEPOSIT_STATUS,
    WITHDRAW_STATUS,
    TRX_TYPE,
    DEFAULT_CURRENT_PAGE,
    DEFAULT_ITEM_PER_PAGE,
} from './ui-constants.mjs';
import SuspendModal from './modal/SuspendModal.jsx';

const STATUS_BADGE_STYLE = {
    padding: '0.25rem 0.7rem',
    borderRadius: '6px',
    fontSize: '0.75rem',
    fontWeight: 600,
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.35rem',
};

function getStatusBadge(status) {
    if (status === USER_STATUS.ACTIVE) {
        return (
            <span style={{ ...STATUS_BADGE_STYLE, background: '#D1E7DD', color: '#198754', border: '1px solid #A3CFBB' }}>
                <CheckCircle2 size={12} /> Active
            </span>
        );
    };

    if (status === USER_STATUS.SUSPENDED) {
        return (
            <span style={{ ...STATUS_BADGE_STYLE, background: '#F8D7DA', color: '#DC3545', border: '1px solid #F1AEB5' }}>
                <ShieldOff size={12} /> Suspended
            </span>
        );
    };

    return (
        <span style={{ ...STATUS_BADGE_STYLE, background: '#FFF3CD', color: '#664D03', border: '1px solid #FFECB5' }}>
            <Clock size={12} /> Inactive
        </span>
    );
};

function getTwoFABadge(twoFAStatus) {
    if (twoFAStatus === TWOFA_STATUS.ENABLED) {
        return (
            <span style={{ ...STATUS_BADGE_STYLE, background: '#E7F1FF', color: '#0D6EFD', border: '1px solid #9EC5FE' }}>
                <ShieldCheck size={12} /> ON
            </span>
        );
    };

    return (
        <span style={{ ...STATUS_BADGE_STYLE, background: '#F1F3F5', color: '#6C757D', border: '1px solid #DEE2E6' }}>
            OFF
        </span>
    );
};

function getTxStatusBadge(status) {
    const st = status?.toUpperCase();
    if (st === DEPOSIT_STATUS.CONFIRMED || st === WITHDRAW_STATUS.CONFIRMED) {
        return <span style={{ ...STATUS_BADGE_STYLE, background: '#D1E7DD', color: '#198754', border: '1px solid #A3CFBB' }}>Confirmed</span>;
    };

    if (st === DEPOSIT_STATUS.PENDING || st === WITHDRAW_STATUS.PENDING) {
        return <span style={{ ...STATUS_BADGE_STYLE, background: '#FFF3CD', color: '#664D03', border: '1px solid #FFECB5' }}>Pending</span>;
    };

    if (st === DEPOSIT_STATUS.FAILED || st === WITHDRAW_STATUS.FAILED) {
        return <span style={{ ...STATUS_BADGE_STYLE, background: '#F8D7DA', color: '#DC3545', border: '1px solid #F1AEB5' }}>Failed</span>;
    };

    return <span style={{ ...STATUS_BADGE_STYLE, background: '#F1F3F5', color: '#6C757D', border: '1px solid #DEE2E6' }}>{status}</span>;
};

function getTxTypeBadge(type) {
    if (type === TRX_TYPE.DEPOSIT) {
        return <span style={{ ...STATUS_BADGE_STYLE, background: '#D1E7DD', color: '#198754', border: '1px solid #A3CFBB' }}>Deposit</span>;
    };

    return <span style={{ ...STATUS_BADGE_STYLE, background: '#E7F1FF', color: '#0D6EFD', border: '1px solid #9EC5FE' }}>Withdraw</span>;
};

function InfoRow({ label, value, mono }) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid #F1F3F5' }}>
            <div style={{ color: '#6C757D', fontSize: '0.85rem' }}>{label}</div>
            <div style={{ color: '#212529', fontSize: '0.85rem', fontWeight: 500, wordBreak: 'break-all', textAlign: 'right', maxWidth: '60%' }}>
                {mono ? <code style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{value || '-'}</code> : value || '-'}
            </div>
        </div>
    );
};

export function UserDetails({ userId }) {
    const { toastError } = useToast();
    const [loading, setLoading] = useState(true);
    const [transactionLoading, setTransactionLoading] = useState(false);
    const [user, setUser] = useState(null);
    const [suspendHistory, setSuspendHistory] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [pagination, setPagination] = useState({
        totalCount: 0,
        totalPages: 0,
        currentPage: DEFAULT_CURRENT_PAGE,
        limit: DEFAULT_ITEM_PER_PAGE,
    });
    const [txType, setTxType] = useState('ALL');
    const [txStatus, setTxStatus] = useState('ALL');
    const [userStatus, setUserStatus] = useState(USER_STATUS.INACTIVE);

    const [suspendModal, setSuspendModal] = useState(null);

    const fetchDetails = useCallback(async () => {
        if (!userId) return;

        setLoading(true);
        try {
            const params = new URLSearchParams();

            const res = await axios.get(`/api/admin/users/${userId}?${params.toString()}`);
            if (res.data?.flag && res.data?.data) {
                const d = res.data.data;
                setUser(d.user);
                setUserStatus(d.user?.status ?? USER_STATUS.INACTIVE);
                setSuspendHistory(d.user?.suspendHistory || []);
            } else {
                toastError(res.data?.msg || res.data?.message || 'Failed to load user details');
            };
        } catch (err) {
            const errMsg = err.response?.data?.msg || err.response?.data?.message || 'Failed to load user details.';
            toastError(errMsg);
        } finally {
            setLoading(false);
        };
    }, [userId, toastError]);

    const fetchTrxDetails = useCallback(async () => {
        if (!userId) return;

        setTransactionLoading(true);
        try {
            const params = new URLSearchParams();
            params.set('page', String(pagination.currentPage));
            params.set('limit', String(pagination.limit));
            params.set('txType', txType);
            params.set('txStatus', txStatus);
            params.set('userId', userId);

            const res = await axios.get(`/api/admin/transaction?${params.toString()}`);
            if (res.data?.flag && res.data?.data) {
                const d = res.data.data;
                setTransactions(d.transactions || []);
                setPagination(d.pagination || { totalCount: 0, totalPages: 0, currentPage: DEFAULT_CURRENT_PAGE, limit: DEFAULT_ITEM_PER_PAGE });
            } else {
                toastError(res.data?.msg || res.data?.message || 'Failed to load transaction details');
            };
        } catch (err) {
            const errMsg = err.response?.data?.msg || err.response?.data?.message || 'Failed to load transaction details.';
            toastError(errMsg);
        } finally {
            setTransactionLoading(false);
        };
    }, [userId, pagination.currentPage, pagination.limit, txType, txStatus, toastError]);

    useEffect(() => {
        fetchDetails();
    }, [fetchDetails]);

    useEffect(() => {
        fetchTrxDetails();
    }, [fetchTrxDetails]);

    const handleStatusChange = async (e) => {
        const statusVal = Number(e.target.value);

        if (statusVal === USER_STATUS.SUSPENDED) {
            setSuspendModal(user);
            return;
        };

        handleStatusAction({ statusVal });
    };

    const handleStatusAction = async ({ statusVal, reason = "" }) => {
        if (!user?._id || !statusVal) return;

        const numericStatus = Number(statusVal);

        if (numericStatus === USER_STATUS.SUSPENDED) {
            if (!reason || reason.trim().length < 3) {
                toastError('Suspend reason is required and must be at least 3 characters.');
                return;
            };
        };

        setLoading(true);

        try {
            const payload = {
                action: numericStatus,
                reason: reason.trim(),
            };

            const res = await axios.patch(`/api/admin/users/${user._id}/status`, payload);
            if (res.data?.flag) {
                setSuspendModal(null);
                await fetchDetails();
            } else {
                toastError(res.data?.msg || res.data?.message || 'Failed to update user status');
            };
        } catch (err) {
            const errMsg = err.response?.data?.msg || err.response?.data?.message || 'Failed to update user status.';
            toastError(errMsg);
        } finally {
            setLoading(false);
        };
    };

    const handleTxTypeChange = (e) => {
        const type = e.target.value;

        setPagination((prev) => ({
            ...prev,
            currentPage: DEFAULT_CURRENT_PAGE,
        }));

        setTxType(type);
    };

    const handleTxStatusChange = (e) => {
        const status = e.target.value;
        setPagination((prev) => ({
            ...prev,
            currentPage: DEFAULT_CURRENT_PAGE,
        }));

        setTxStatus(status);
    };

    const handleLimitChange = (e) => {
        setPagination((p) => ({ ...p, limit: parseInt(e.target.value, 10), currentPage: DEFAULT_CURRENT_PAGE }));
    };

    const handlePageChange = (pg) => {
        if (pg < 1 || pg > pagination.totalPages) return;
        setPagination((p) => ({ ...p, currentPage: pg }));
    };

    const getPageNumbers = () => {
        const total = pagination.totalPages;
        const current = pagination.currentPage;

        if (total <= 5) {
            return Array.from({ length: total }, (_, i) => i + 1);
        };

        if (current <= 2) {
            return [1, 2, 3, '...', total];
        };

        if (current >= total - 1) {
            return [1, '...', total - 2, total - 1, total];
        };

        return [1, '...', current - 1, current, current + 1, '...', total];
    };

    if (loading && !user) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
                <div style={{ color: '#6C757D', fontSize: '0.9rem' }}>Loading user details...</div>
            </div>
        );
    };

    if (!user) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '2rem', background: '#FFFFFF', border: '1px solid #DEE2E6', borderRadius: '6px' }}>
                <div style={{ color: '#DC3545', fontWeight: 600 }}>User not found</div>
                <Link href="/user" style={{ color: '#0D6EFD', textDecoration: 'none', fontSize: '0.9rem' }}>← Back to Users</Link>
            </div>
        );
    };

    const explorerBase = 'https://explorer.solana.com';
    const clusterParam = user.network ? `?cluster=${user.network}` : '?cluster=devnet';

    const startEntry = pagination.totalCount === 0 ? 0 : (pagination.currentPage - 1) * pagination.limit + 1;
    const endEntry = Math.min(pagination.currentPage * pagination.limit, pagination.totalCount);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <div style={{ color: '#6C757D', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                        <Link href="/user" style={{ color: '#6C757D', textDecoration: 'none' }}>User Management</Link> / User Details
                    </div>
                    <h1 style={{ color: '#212529', fontSize: '1.4rem', fontWeight: 700, margin: 0 }}>User Details</h1>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <select
                        value={userStatus}
                        onChange={handleStatusChange}
                        style={{
                            background: '#FFFFFF',
                            border: '1px solid #DEE2E6',
                            padding: '0.6rem 1rem',
                            borderRadius: '6px',
                            fontSize: '0.83rem',
                            outline: 'none',
                            cursor: 'pointer',
                        }}
                    >
                        <option value={USER_STATUS.INACTIVE}>Inactive</option>
                        <option value={USER_STATUS.ACTIVE}>Active</option>
                        <option value={USER_STATUS.SUSPENDED}>Suspended</option>
                    </select>
                    <Link
                        href="/user"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#FFFFFF', border: '1px solid #DEE2E6', color: '#212529', padding: '0.5rem 1rem', borderRadius: '6px', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 500 }}
                    >
                        <ArrowLeft size={14} /> Back to Users
                    </Link>
                </div>
            </div>
            <div className="user-details-layout">
                <div style={{
                    background: '#FFFFFF',
                    border: '1px solid #DEE2E6',
                    borderRadius: '6px',
                    padding: '1.25rem',
                }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                        {user.profilePhoto ? (
                            <img
                                src={user.profilePhoto}
                                alt={user.fullName}
                                style={{
                                    width: '90px',
                                    height: '90px',
                                    borderRadius: '50%',
                                    objectFit: 'cover',
                                    border: '1px solid #DEE2E6',
                                }}
                                onError={(e) => { e.target.style.display = 'none'; }}
                            />
                        ) : (
                            <div style={{ width: '90px', height: '90px', borderRadius: '50%', background: '#E7F1FF', color: '#0D6EFD', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 700, border: '1px solid #9EC5FE' }}>
                                {(user.fullName || '').charAt(0).toUpperCase()}
                            </div>
                        )}
                        <div style={{ color: '#212529', fontSize: '1.1rem', fontWeight: 600, textAlign: 'center' }}>
                            {user.fullName}
                        </div>
                    </div>
                    <div style={{ height: '1px', background: '#DEE2E6', marginBottom: '1rem' }} />
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <InfoRow label="Email" value={user.email} mono />
                        {user.mobileNumber ? <InfoRow label="Mobile Number" value={user.mobileNumber} /> : null}
                        {user.referralCode ? <InfoRow label="Referral Code" value={user.referralCode} /> : null}
                        {user.memo ? <InfoRow label="Memo" value={user.memo} /> : null}
                        {user.walletAddress ? <InfoRow label="Wallet Address" value={user.walletAddress} mono /> : null}
                        {user.walletBalance !== undefined ? <InfoRow label="Available SOL Balance" value={Number(user.walletBalance).toFixed(8) + ' SOL'} /> : null}
                        <InfoRow label="Account Status" value={getStatusBadge(user.status)} />
                        <InfoRow label="2FA Status" value={getTwoFABadge(user.twoFAStatus)} />
                        {user.suspendReason ? <InfoRow label="Current Suspend Reason" value={user.suspendReason} /> : null}
                        {user.lastLogin ? <InfoRow label="Last Login" value={moment(user.lastLogin).format('MMM DD, YYYY HH:mm:ss')} /> : null}
                        <InfoRow label="Created At" value={moment(user.createdAt).format('MMM DD, YYYY HH:mm:ss')} />
                        <InfoRow label="Updated At" value={moment(user.updatedAt).format('MMM DD, YYYY HH:mm:ss')} />
                    </div>
                </div>
                <div style={{
                    background: '#FFFFFF',
                    border: '1px solid #DEE2E6',
                    borderRadius: '6px',
                    padding: '1.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem',
                    minWidth: 0,
                }}>
                    {/* <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                            <History size={16} style={{ color: '#6C757D' }} />
                            <h2 style={{ color: '#212529', fontSize: '1rem', fontWeight: 600, margin: 0 }}>Suspend History</h2>
                        </div>
                        <div style={{ overflowX: 'auto', borderRadius: '16px', border: '1px solid #DEE2E6' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                                <thead>
                                    <tr
                                        style={{
                                            background: '#F5F9FC',
                                            color: '#171D25',
                                            borderBottom: '1px solid #D8DFE4'
                                        }}
                                    >
                                        <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>#</th>
                                        <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Action</th>
                                        <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Reason</th>
                                        <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Date & Time</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {suspendHistory.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: '#6C757D' }}>No suspend history found.</td>
                                        </tr>
                                    ) : (
                                        [...suspendHistory].reverse().map((entry, idx) => {
                                            const isActive = !entry.activatedAt;
                                            return (
                                                <tr
                                                    key={idx}
                                                    style={{ borderBottom: '1px solid #DEE2E6', transition: 'background 0.15s' }}
                                                    className="hover:bg-gray-50"
                                                >
                                                    <td style={{ padding: '0.75rem 1rem' }}>{idx + 1}</td>
                                                    <td style={{ padding: '0.75rem 1rem' }}>
                                                        {isActive ? (
                                                            <span style={{ ...STATUS_BADGE_STYLE, background: '#F8D7DA', color: '#DC3545', border: '1px solid #F1AEB5' }}>Suspended</span>
                                                        ) : (
                                                            <span style={{ ...STATUS_BADGE_STYLE, background: '#D1E7DD', color: '#198754', border: '1px solid #A3CFBB' }}>Activated</span>
                                                        )}
                                                    </td>
                                                    <td style={{ padding: '0.75rem 1rem', wordBreak: 'break-word' }}>{entry.reason || '-'}</td>
                                                    <td style={{ padding: '0.75rem 1rem', color: '#6C757D', fontSize: '0.8rem' }}>
                                                        {entry.suspendedAt && `Suspended: ${moment(entry.suspendedAt).format('MMM DD, YYYY HH:mm')}`}
                                                        {entry.activatedAt && (
                                                            <>
                                                                <br />
                                                                Activated: {moment(entry.activatedAt).format('MMM DD, YYYY HH:mm')}
                                                            </>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div style={{ height: '1px', background: '#DEE2E6', marginBottom: '1rem', marginTop: '1rem' }} /> */}
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.25rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Activity size={16} style={{ color: '#0D6EFD' }} />
                                <h2 style={{ color: '#212529', fontSize: '1rem', fontWeight: 600, margin: 0 }}>Transaction History</h2>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                <select
                                    value={txType}
                                    onChange={handleTxTypeChange}
                                    style={{
                                        background: '#FFFFFF',
                                        border: '1px solid #DEE2E6',
                                        padding: '0.4rem 0.6rem',
                                        borderRadius: '6px',
                                        fontSize: '0.8rem',
                                    }}
                                >
                                    <option value="ALL">All Transactions</option>
                                    <option value="DEPOSIT">Deposits</option>
                                    <option value="WITHDRAW">Withdrawals</option>
                                </select>
                                <select
                                    value={txStatus}
                                    onChange={handleTxStatusChange}
                                    style={{
                                        background: '#FFFFFF',
                                        border: '1px solid #DEE2E6',
                                        padding: '0.4rem 0.6rem',
                                        borderRadius: '6px',
                                        fontSize: '0.8rem',
                                    }}
                                >
                                    <option value="ALL">All Status</option>
                                    <option value="PENDING">Pending</option>
                                    <option value="PROCESSING">Processing</option>
                                    <option value="CONFIRMED">Confirmed</option>
                                    <option value="FAILED">Failed</option>
                                </select>
                                <select
                                    value={pagination.limit}
                                    onChange={handleLimitChange}
                                    style={{
                                        background: '#FFFFFF',
                                        border: '1px solid #DEE2E6',
                                        padding: '0.4rem 0.6rem',
                                        borderRadius: '6px',
                                        fontSize: '0.8rem',
                                    }}
                                >
                                    <option value="10">10</option>
                                    <option value="20">20</option>
                                    <option value="50">50</option>
                                </select>
                            </div>
                        </div>
                        <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid #DEE2E6' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                                <thead>
                                    <tr
                                        style={{
                                            background: '#F5F9FC',
                                            color: '#171D25',
                                            borderBottom: '1px solid #D8DFE4'
                                        }}
                                    >
                                        <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>#</th>
                                        <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Trx Hash</th>
                                        <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>From</th>
                                        <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>To</th>
                                        <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Amount (SOL)</th>
                                        <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Type</th>
                                        <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Status</th>
                                        <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Date & Time</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {transactionLoading ? (
                                        <tr>
                                            <td
                                                colSpan={8}
                                                style={{
                                                    padding: '2rem',
                                                    textAlign: 'center',
                                                    color: '#6C757D',
                                                }}
                                            >
                                                Loading transactions...
                                            </td>
                                        </tr>
                                    ) : transactions.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} style={{ padding: '2rem', textAlign: 'center', color: '#6C757D' }}>
                                                No transactions found.
                                            </td>
                                        </tr>
                                    ) : (
                                        transactions.map((tx, idx) => {
                                            const sig = tx.transactionSignature;
                                            const explorerUrl = sig ? `${explorerBase}/tx/${sig}${clusterParam}` : null;
                                            const start = (pagination.currentPage - 1) * pagination.limit + idx + 1;
                                            const fromAddress = tx.platformAddress || '-';
                                            const toAddress = tx.toAddress || '-';

                                            return (
                                                <tr
                                                    key={tx._id || idx}
                                                    style={{ borderBottom: '1px solid #DEE2E6', transition: 'background 0.15s' }}
                                                    className="hover:bg-gray-50"
                                                >
                                                    <td style={{ padding: '0.75rem 1rem' }}>
                                                        {start}
                                                    </td>
                                                    <td style={{ padding: '0.75rem 1rem' }}>
                                                        {sig ? (
                                                            <a
                                                                href={explorerUrl}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                style={{
                                                                    color: '#0D6EFD',
                                                                    textDecoration: 'none',
                                                                    display: 'inline-flex',
                                                                    alignItems: 'center',
                                                                    gap: '0.25rem',
                                                                    fontSize: '0.8rem',
                                                                    wordBreak: 'break-all',
                                                                }}
                                                            >
                                                                <span style={{ fontFamily: 'monospace' }}>
                                                                    {sig.slice(0, 6)}...{sig.slice(-6)}
                                                                </span>
                                                                <ExternalLink size={12} />
                                                            </a>
                                                        ) : (
                                                            <span style={{ color: '#6C757D', fontFamily: 'monospace', fontSize: '0.8rem' }}>-</span>
                                                        )}
                                                    </td>
                                                    <td style={{ padding: '0.85rem 1rem' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                                            <span style={{ fontFamily: 'monospace', color: '#6C757D', fontSize: '0.75rem' }}>
                                                                {fromAddress.length > 12 ? `${fromAddress.slice(0, 6)}...${fromAddress.slice(-6)}` : fromAddress}
                                                            </span>
                                                            {fromAddress !== '-' && <CopyButton text={fromAddress} />}
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '0.85rem 1rem' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                                            <span style={{ fontFamily: 'monospace', color: '#6C757D', fontSize: '0.75rem' }}>
                                                                {toAddress.length > 12 ? `${toAddress.slice(0, 6)}...${toAddress.slice(-6)}` : toAddress}
                                                            </span>
                                                            {toAddress !== '-' && <CopyButton text={toAddress} />}
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '0.75rem 1rem', fontWeight: 500 }}>
                                                        {Number(tx.amount).toFixed(8)}
                                                    </td>
                                                    <td style={{ padding: '0.75rem 1rem' }}>
                                                        {getTxTypeBadge(tx.transactionType)}
                                                    </td>
                                                    <td style={{ padding: '0.75rem 1rem' }}>
                                                        {getTxStatusBadge(tx.status)}
                                                    </td>
                                                    <td style={{ padding: '0.75rem 1rem', color: '#6C757D', fontSize: '0.8rem' }}>
                                                        {moment(tx.createdAt).format('MMM DD, YYYY HH:mm')}
                                                    </td>
                                                </tr>
                                            );
                                        }))}
                                </tbody>
                            </table>
                        </div>
                        {pagination.totalCount > 0 && (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.08)', flexWrap: 'wrap', gap: '1rem' }}>
                                <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                                    Showing <strong style={{ color: '#212529' }}>{startEntry}</strong> to <strong style={{ color: '#212529' }}>{endEntry}</strong> of <strong style={{ color: '#212529' }}>{pagination.totalCount}</strong> transactions
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <button
                                        type="button"
                                        onClick={() => handlePageChange(pagination.currentPage - 1)}
                                        disabled={pagination.currentPage <= 1 || transactionLoading}
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
                                                disabled={transactionLoading || p === pagination.currentPage}
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
                                        disabled={pagination.currentPage >= pagination.totalPages || transactionLoading}
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
                </div>
            </div>

            {suspendModal && (
                <SuspendModal
                    user={suspendModal}
                    onConfirm={handleStatusAction}
                    onClose={() => setSuspendModal(null)}
                    loading={loading}
                />
            )}
        </div>
    );
};