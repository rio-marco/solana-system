'use client';

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import moment from 'moment';
import Link from 'next/link';
import {
    UserCog,
    Search,
    RefreshCw,
    Plus,
    Pencil,
    Trash2,
    Eye,
    CheckCircle2,
    ShieldOff,
    Clock,
} from 'lucide-react';
import {
    MANAGER_STATUS,
    DEFAULT_CURRENT_PAGE,
    DEFAULT_ITEM_PER_PAGE,
} from './ui-constants.mjs';
import { Pagination } from './Pagination';
import { useToast } from '../context/ToastContext';
import ManagerModal from './modal/ManagerModal.jsx';
import ConfirmModal from './modal/ConfirmModal.jsx';

function getStatusBadge(status) {
    if (status === MANAGER_STATUS.ACTIVE) {
        return (
            <span style={{ background: 'rgba(25,135,84,0.12)', color: '#198754', border: '1px solid rgba(25,135,84,0.3)', padding: '0.2rem 0.65rem', borderRadius: '20px', fontSize: '0.73rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                <CheckCircle2 size={11} /> Active
            </span>
        );
    };

    if (status === MANAGER_STATUS.SUSPENDED) {
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

export function ManagerManagement() {
    const { toastError, toastSuccess } = useToast();

    const [loading, setLoading] = useState(false);
    const [managers, setManagers] = useState([]);
    const [pagination, setPagination] = useState({
        totalCount: 0,
        totalPages: 0,
        currentPage: DEFAULT_CURRENT_PAGE,
        limit: DEFAULT_ITEM_PER_PAGE,
    });

    const [searchFilter, setSearchFilter] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');

    const [managerModal, setManagerModal] = useState(null);
    const [saving, setSaving] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        const t = setTimeout(() => {
            setDebouncedSearch(searchFilter);
            setPagination((p) => ({ ...p, currentPage: DEFAULT_CURRENT_PAGE }));
        }, 350);

        return () => clearTimeout(t);
    }, [searchFilter]);

    const fetchManagers = useCallback(async () => {
        setLoading(true);
        try {
            const params = {
                page: pagination.currentPage,
                limit: pagination.limit,
                search: debouncedSearch,
                status: statusFilter,
            };

            const res = await axios.get('/api/admin/managers', { params });
            if (res.data?.flag && res.data?.data) {
                const d = res.data.data;
                setManagers(d.managers || []);
                setPagination((p) => ({ ...p, totalCount: d.totalCount || 0, totalPages: d.totalPages || 0 }));
            } else {
                setManagers([]);
            };
        } catch (err) {
            console.error('Failed to fetch managers:', err);
            toastError(err.response?.data?.msg || err.response?.data?.message || 'Failed to fetch managers.');
            setManagers([]);
        } finally {
            setLoading(false);
        };
    }, [pagination.currentPage, pagination.limit, debouncedSearch, statusFilter, toastError]);

    useEffect(() => {
        fetchManagers();
    }, [fetchManagers]);

    const handleStatusChange = (e) => {
        setStatusFilter(e.target.value);
        setPagination((p) => ({ ...p, currentPage: DEFAULT_CURRENT_PAGE }));
    };

    const handleLimitChange = (e) => {
        setPagination((p) => ({ ...p, limit: parseInt(e.target.value, 10), currentPage: DEFAULT_CURRENT_PAGE }));
    };

    const handlePageChange = (pg) => {
        if (pg >= 1 && pg <= pagination.totalPages && !loading) {
            setPagination((p) => ({ ...p, currentPage: pg }));
        };
    };

    const handleSave = async (payload) => {
        if (!managerModal) return;

        const editing = managerModal.manager;
        const isEdit = Boolean(editing?._id);

        setSaving(true);

        try {
            const formData = new FormData();
            formData.append('name', payload.name);
            formData.append('email', payload.email);
            formData.append('countryCode', payload.countryCode || '');
            formData.append('phoneNumber', payload.phoneNumber || '');
            formData.append('status', String(payload.status));

            if (payload.file) {
                formData.append('profilePhoto', payload.file);
            };

            const res = isEdit
                ? await axios.patch(`/api/admin/managers/${editing._id}`, formData)
                : await axios.post('/api/admin/managers', formData);

            if (res.data?.flag) {
                toastSuccess(res.data?.msg || (isEdit ? 'Manager updated successfully.' : 'Manager created successfully.'));
                setManagerModal(null);

                if (!isEdit && pagination.currentPage !== DEFAULT_CURRENT_PAGE) {
                    setPagination((p) => ({ ...p, currentPage: DEFAULT_CURRENT_PAGE }));
                } else {
                    await fetchManagers();
                };
            } else {
                toastError(res.data?.msg || res.data?.message || 'Failed to save manager.');
            };
        } catch (err) {
            toastError(err.response?.data?.msg || err.response?.data?.message || 'Failed to save manager.');
        } finally {
            setSaving(false);
        };
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;

        setDeleting(true);

        try {
            const res = await axios.delete(`/api/admin/managers/${deleteTarget._id}`);

            if (res.data?.flag) {
                toastSuccess(res.data?.msg || 'Manager deleted successfully.');
                const wasLastOnPage = managers.length === 1 && pagination.currentPage > DEFAULT_CURRENT_PAGE;
                setDeleteTarget(null);

                if (wasLastOnPage) {
                    setPagination((p) => ({ ...p, currentPage: p.currentPage - 1 }));
                } else {
                    await fetchManagers();
                };
            } else {
                toastError(res.data?.msg || res.data?.message || 'Failed to delete manager.');
            };
        } catch (err) {
            toastError(err.response?.data?.msg || err.response?.data?.message || 'Failed to delete manager.');
        } finally {
            setDeleting(false);
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

    const actionButtonStyle = (variant) => ({
        padding: '0.35rem 0.6rem',
        borderRadius: '6px',
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.25rem',
        fontSize: '0.73rem',
        fontWeight: 600,
        textDecoration: 'none',
        background: variant === 'danger' ? 'rgba(239,68,68,0.1)' : '#E7F1FF',
        border: variant === 'danger' ? '1px solid rgba(239,68,68,0.3)' : '1px solid #9EC5FE',
        color: variant === 'danger' ? '#ef4444' : '#0D6EFD',
    });

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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#0D6EFD', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem' }}>
                        <UserCog size={16} /> Manager Management
                    </div>
                    <h1 style={{ color: '#212529', fontSize: '1.6rem', fontWeight: 900, margin: 0 }}>All Managers</h1>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <button
                        type="button"
                        onClick={fetchManagers}
                        disabled={loading}
                        style={{ background: '#F5F9FC', border: '1px solid #D8DFE4', color: '#212529', padding: '0.6rem 1.25rem', borderRadius: '12px', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: 700 }}
                    >
                        <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Refresh
                    </button>
                    <button
                        type="button"
                        onClick={() => setManagerModal({ manager: null })}
                        style={{ background: 'linear-gradient(135deg, #0D6EFD 0%, #0a58ca 100%)', border: 'none', color: '#FFFFFF', padding: '0.6rem 1.25rem', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: 700 }}
                    >
                        <Plus size={15} /> New Manager
                    </button>
                </div>
            </div>

            {/* Main Card */}
            <div style={{ background: '#FFFFFF', borderRadius: '6px', border: '1px solid #DEE2E6', padding: '1.75rem', boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1), 0 1px 2px 0 rgba(0,0,0,0.06)' }}>
                {/* Filters */}
                <div style={{ display: 'flex', gap: '0.85rem', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
                        <Search size={14} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                        <input
                            type="text"
                            value={searchFilter}
                            onChange={(e) => setSearchFilter(e.target.value)}
                            placeholder="Search by name or email..."
                            style={{ width: '100%', ...selectStyle, paddingLeft: '2.4rem', cursor: 'text' }}
                        />
                    </div>
                    <select value={statusFilter} onChange={handleStatusChange} style={selectStyle}>
                        <option value="ALL">All Status</option>
                        <option value={MANAGER_STATUS.ACTIVE}>Active</option>
                        <option value={MANAGER_STATUS.INACTIVE}>Inactive</option>
                        <option value={MANAGER_STATUS.SUSPENDED}>Suspended</option>
                    </select>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#94a3b8', fontSize: '0.8rem' }}>
                        <span>Per page:</span>
                        <select value={pagination.limit} onChange={handleLimitChange} style={{ ...selectStyle, padding: '0.45rem 0.65rem' }}>
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
                            <tr style={{ background: '#F5F9FC', color: '#171D25', borderBottom: '1px solid #D8DFE4' }}>
                                <th style={{ padding: '0.9rem 1rem', fontWeight: 600 }}>Manager</th>
                                <th style={{ padding: '0.9rem 1rem', fontWeight: 600 }}>Phone</th>
                                <th style={{ padding: '0.9rem 1rem', fontWeight: 600 }}>Status</th>
                                <th style={{ padding: '0.9rem 1rem', fontWeight: 600 }}>Created</th>
                                <th style={{ padding: '0.9rem 1rem', fontWeight: 600, textAlign: 'center' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                                        <div style={{ width: '32px', height: '32px', border: '3px solid rgba(13,110,253,0.3)', borderTop: '3px solid #0D6EFD', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 0.75rem' }} />
                                        <span>Fetching managers...</span>
                                    </td>
                                </tr>
                            ) : managers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                                        No managers found. Click &ldquo;New Manager&rdquo; to create one.
                                    </td>
                                </tr>
                            ) : managers.map((manager) => (
                                <tr key={manager._id} style={{ borderBottom: '1px solid #DEE2E6', transition: 'background 0.15s' }} className="hover:bg-gray-50">
                                    {/* Manager */}
                                    <td style={{ padding: '0.85rem 1rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            {manager.profilePhoto ? (
                                                <img
                                                    src={manager.profilePhoto}
                                                    alt={manager.name}
                                                    style={{ width: '36px', height: '36px', borderRadius: '10px', objectFit: 'cover', border: '1px solid #DEE2E6', flexShrink: 0 }}
                                                    onError={(e) => { e.target.style.display = 'none'; }}
                                                />
                                            ) : (
                                                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#E7F1FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 800, color: '#0D6EFD', flexShrink: 0 }}>
                                                    {manager.name?.[0]?.toUpperCase() || '?'}
                                                </div>
                                            )}
                                            <div>
                                                <div style={{ color: '#212529', fontWeight: 700, fontSize: '0.88rem' }}>{manager.name}</div>
                                                <div style={{ color: '#64748b', fontSize: '0.75rem' }}>{manager.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    {/* Phone */}
                                    <td style={{ padding: '0.85rem 1rem', color: '#64748b', fontSize: '0.8rem' }}>
                                        {manager.phoneNumber ? `${manager.countryCode || ''} ${manager.phoneNumber}`.trim() : '—'}
                                    </td>
                                    {/* Status */}
                                    <td style={{ padding: '0.85rem 1rem' }}>
                                        {getStatusBadge(manager.status)}
                                    </td>
                                    {/* Created */}
                                    <td style={{ padding: '0.85rem 1rem', color: '#64748b', fontSize: '0.78rem' }}>
                                        {moment(manager.createdAt).format('MMM DD, YYYY')}
                                    </td>
                                    {/* Actions */}
                                    <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                                            <Link href={`/manager/${manager._id}`} title="View Manager Details" style={actionButtonStyle('primary')}>
                                                <Eye size={13} /> View
                                            </Link>
                                            <button type="button" title="Edit Manager" onClick={() => setManagerModal({ manager })} style={actionButtonStyle('primary')}>
                                                <Pencil size={13} /> Edit
                                            </button>
                                            <button type="button" title="Delete Manager" onClick={() => setDeleteTarget(manager)} style={actionButtonStyle('danger')}>
                                                <Trash2 size={13} /> Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
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
                    itemLabel="managers"
                />
            </div>

            {/* Modals */}
            {managerModal && (
                <ManagerModal
                    manager={managerModal.manager}
                    onConfirm={handleSave}
                    onClose={() => setManagerModal(null)}
                    loading={saving}
                />
            )}

            {deleteTarget && (
                <ConfirmModal
                    title="Delete Manager"
                    subtitle={deleteTarget.email}
                    message={`Are you sure you want to delete the manager "${deleteTarget.name}"? This action cannot be undone.`}
                    confirmLabel="Delete Manager"
                    loading={deleting}
                    onConfirm={handleDelete}
                    onClose={() => setDeleteTarget(null)}
                />
            )}
        </div>
    );
};