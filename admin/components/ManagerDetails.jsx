'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import axios from 'axios';
import moment from 'moment';
import { useToast } from '../context/ToastContext';
import {
    ArrowLeft,
    UserCog,
    CheckCircle2,
    ShieldOff,
    Clock,
    Pencil,
    Mail,
    Phone,
    Calendar,
    RefreshCw,
} from 'lucide-react';
import { MANAGER_STATUS } from './ui-constants.mjs';
import ManagerModal from './modal/ManagerModal.jsx';

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
    if (status === MANAGER_STATUS.ACTIVE) {
        return (
            <span style={{ ...STATUS_BADGE_STYLE, background: '#D1E7DD', color: '#198754', border: '1px solid #A3CFBB' }}>
                <CheckCircle2 size={12} /> Active
            </span>
        );
    };

    if (status === MANAGER_STATUS.SUSPENDED) {
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

function InfoRow({ label, value, mono, icon: Icon }) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0', borderBottom: '1px solid #F1F3F5' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: '#6C757D', fontSize: '0.85rem' }}>
                {Icon ? <Icon size={14} /> : null} {label}
            </div>
            <div style={{ color: '#212529', fontSize: '0.85rem', fontWeight: 500, wordBreak: 'break-all', textAlign: 'right', maxWidth: '60%' }}>
                {mono ? <code style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{value || '-'}</code> : (value || '-')}
            </div>
        </div>
    );
};

export function ManagerDetails({ managerId }) {
    const { toastError, toastSuccess } = useToast();

    const [loading, setLoading] = useState(true);
    const [manager, setManager] = useState(null);
    const [managerStatus, setManagerStatus] = useState(MANAGER_STATUS.INACTIVE);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [savingManager, setSavingManager] = useState(false);
    const [statusUpdating, setStatusUpdating] = useState(false);

    const fetchDetails = useCallback(async () => {
        if (!managerId) return;

        setLoading(true);
        try {
            const res = await axios.get(`/api/admin/managers/${managerId}`);
            if (res.data?.flag && res.data?.data) {
                const m = res.data.data.manager;
                setManager(m);
                setManagerStatus(m?.status ?? MANAGER_STATUS.INACTIVE);
            } else {
                toastError(res.data?.msg || res.data?.message || 'Failed to load manager details');
            };
        } catch (err) {
            const errMsg = err.response?.data?.msg || err.response?.data?.message || 'Failed to load manager details.';
            toastError(errMsg);
        } finally {
            setLoading(false);
        };
    }, [managerId, toastError]);

    useEffect(() => {
        fetchDetails();
    }, [fetchDetails]);

    const handleStatusChange = async (e) => {
        const statusVal = Number(e.target.value);

        if (!manager?._id || !statusVal || statusUpdating) return;

        setStatusUpdating(true);
        try {
            const res = await axios.patch(`/api/admin/managers/${manager._id}`, { status: statusVal });
            if (res.data?.flag) {
                toastSuccess(res.data?.msg || 'Manager status updated successfully.');
                await fetchDetails();
            } else {
                toastError(res.data?.msg || res.data?.message || 'Failed to update manager status');
                setManagerStatus(manager.status);
            };
        } catch (err) {
            const errMsg = err.response?.data?.msg || err.response?.data?.message || 'Failed to update manager status.';
            toastError(errMsg);
            setManagerStatus(manager.status);
        } finally {
            setStatusUpdating(false);
        };
    };

    const handleEditManager = async ({ name, email, phoneNumber, status, file }) => {
        setSavingManager(true);

        try {
            const formData = new FormData();
            formData.append('name', name);
            formData.append('email', email);
            formData.append('phoneNumber', phoneNumber || '');
            formData.append('status', String(status));

            if (file) {
                formData.append('profilePhoto', file);
            };

            const res = await axios.patch(`/api/admin/managers/${managerId}`, formData);

            if (res.data?.flag) {
                toastSuccess(res.data?.msg || 'Manager updated successfully.');
                setEditModalOpen(false);
                await fetchDetails();
            } else {
                toastError(res.data?.msg || res.data?.message || 'Failed to update manager.');
            };
        } catch (err) {
            const errMsg = err.response?.data?.msg || err.response?.data?.message || 'Failed to update manager.';
            toastError(errMsg);
        } finally {
            setSavingManager(false);
        };
    };

    if (loading && !manager) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
                <div style={{ color: '#6C757D', fontSize: '0.9rem' }}>Loading manager details...</div>
            </div>
        );
    };

    if (!manager) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '2rem', background: '#FFFFFF', border: '1px solid #DEE2E6', borderRadius: '6px' }}>
                <div style={{ color: '#DC3545', fontWeight: 600 }}>Manager not found</div>
                <Link href="/manager" style={{ color: '#0D6EFD', textDecoration: 'none', fontSize: '0.9rem' }}>← Back to Managers</Link>
            </div>
        );
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <div style={{ color: '#6C757D', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                        <Link href="/manager" style={{ color: '#6C757D', textDecoration: 'none' }}>Manager Management</Link> / Manager Details
                    </div>
                    <h1 style={{ color: '#212529', fontSize: '1.4rem', fontWeight: 700, margin: 0 }}>Manager Details</h1>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <select
                        value={managerStatus}
                        onChange={handleStatusChange}
                        disabled={statusUpdating}
                        style={{ background: '#FFFFFF', border: '1px solid #DEE2E6', padding: '0.6rem 1rem', borderRadius: '6px', fontSize: '0.83rem', outline: 'none', cursor: statusUpdating ? 'not-allowed' : 'pointer', opacity: statusUpdating ? 0.6 : 1 }}
                    >
                        <option value={MANAGER_STATUS.INACTIVE}>Inactive</option>
                        <option value={MANAGER_STATUS.ACTIVE}>Active</option>
                        <option value={MANAGER_STATUS.SUSPENDED}>Suspended</option>
                    </select>
                    <button
                        type="button"
                        onClick={fetchDetails}
                        disabled={loading}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#F5F9FC', border: '1px solid #D8DFE4', color: '#212529', padding: '0.55rem 1rem', borderRadius: '6px', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '0.85rem', fontWeight: 500 }}
                    >
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
                    </button>
                    <Link
                        href="/manager"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#FFFFFF', border: '1px solid #DEE2E6', color: '#212529', padding: '0.55rem 1rem', borderRadius: '6px', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 500 }}
                    >
                        <ArrowLeft size={14} /> Back to Managers
                    </Link>
                </div>
            </div>

            {/* Info Card */}
            <div style={{ maxWidth: '720px', background: '#FFFFFF', border: '1px solid #DEE2E6', borderRadius: '6px', padding: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <UserCog size={16} style={{ color: '#0D6EFD' }} />
                        <h2 style={{ color: '#212529', fontSize: '1rem', fontWeight: 600, margin: 0 }}>Manager Information</h2>
                    </div>
                    <button
                        type="button"
                        onClick={() => setEditModalOpen(true)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: '#E7F1FF', border: '1px solid #9EC5FE', color: '#0D6EFD', padding: '0.4rem 0.85rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
                    >
                        <Pencil size={13} /> Edit
                    </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                    {manager.profilePhoto ? (
                        <img
                            src={manager.profilePhoto}
                            alt={manager.name}
                            style={{ width: '90px', height: '90px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #DEE2E6' }}
                            onError={(e) => { e.target.style.display = 'none'; }}
                        />
                    ) : (
                        <div style={{ width: '90px', height: '90px', borderRadius: '50%', background: '#E7F1FF', color: '#0D6EFD', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 700, border: '1px solid #9EC5FE' }}>
                            {(manager.name || '').charAt(0).toUpperCase()}
                        </div>
                    )}
                    <div style={{ color: '#212529', fontSize: '1.1rem', fontWeight: 600, textAlign: 'center' }}>{manager.name}</div>
                    <div>{getStatusBadge(manager.status)}</div>
                </div>

                <div style={{ height: '1px', background: '#DEE2E6', marginBottom: '1rem' }} />

                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <InfoRow label="Name" value={manager.name} />
                    <InfoRow label="Email" value={manager.email} mono icon={Mail} />
                    <InfoRow label="Phone Number" value={manager.phoneNumber || '-'} icon={Phone} />
                    <InfoRow label="Account Status" value={getStatusBadge(manager.status)} />
                    <InfoRow label="Created At" value={moment(manager.createdAt).format('MMM DD, YYYY HH:mm:ss')} icon={Calendar} />
                </div>
            </div>

            {editModalOpen && (
                <ManagerModal
                    manager={manager}
                    onConfirm={handleEditManager}
                    onClose={() => setEditModalOpen(false)}
                    loading={savingManager}
                />
            )}
        </div>
    );
};