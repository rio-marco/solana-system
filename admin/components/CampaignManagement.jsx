'use client';

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import moment from 'moment';
import {
    Megaphone,
    Search,
    RefreshCw,
    Plus,
    Pencil,
    Trash2,
    Gift,
    MessageSquare,
} from 'lucide-react';
import {
    DEFAULT_CURRENT_PAGE,
    DEFAULT_ITEM_PER_PAGE,
} from './ui-constants.mjs';
import { Pagination } from './Pagination';
import { useToast } from '../context/ToastContext';
import CampaignModal from './modal/CampaignModal.jsx';
import ConfirmModal from './modal/ConfirmModal.jsx';

function formatRewards(value) {
    const num = Number(value);
    if (!Number.isFinite(num)) return '0';
    return num.toLocaleString(undefined, { maximumFractionDigits: 8 });
};

export function CampaignManagement() {
    const { toastError, toastSuccess } = useToast();

    const [loading, setLoading] = useState(false);
    const [campaigns, setCampaigns] = useState([]);
    const [pagination, setPagination] = useState({
        totalCount: 0,
        totalPages: 0,
        currentPage: DEFAULT_CURRENT_PAGE,
        limit: DEFAULT_ITEM_PER_PAGE,
    });

    const [searchFilter, setSearchFilter] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    const [campaignModal, setCampaignModal] = useState(null); // null = closed; { campaign } = open
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

    const fetchCampaigns = useCallback(async () => {
        setLoading(true);
        try {
            const params = {
                page: pagination.currentPage,
                limit: pagination.limit,
                search: debouncedSearch,
            };

            const res = await axios.get('/api/admin/campaigns', { params });
            if (res.data?.flag && res.data?.data) {
                const d = res.data.data;
                setCampaigns(d.campaigns || []);
                setPagination((p) => ({ ...p, totalCount: d.totalCount || 0, totalPages: d.totalPages || 0 }));
            } else {
                setCampaigns([]);
            };
        } catch (err) {
            console.error('Failed to fetch campaigns:', err);
            toastError(err.response?.data?.msg || err.response?.data?.message || 'Failed to fetch campaigns.');
            setCampaigns([]);
        } finally {
            setLoading(false);
        };
    }, [pagination.currentPage, pagination.limit, debouncedSearch, toastError]);

    useEffect(() => {
        fetchCampaigns();
    }, [fetchCampaigns]);

    const handleLimitChange = (e) => {
        setPagination((p) => ({ ...p, limit: parseInt(e.target.value, 10), currentPage: DEFAULT_CURRENT_PAGE }));
    };

    const handlePageChange = (pg) => {
        if (pg >= 1 && pg <= pagination.totalPages && !loading) {
            setPagination((p) => ({ ...p, currentPage: pg }));
        };
    };

    const handleSave = async (payload) => {
        if (!campaignModal) return;

        const editing = campaignModal.campaign;
        const isEdit = Boolean(editing?._id);
        setSaving(true);

        try {
            const res = isEdit
                ? await axios.patch(`/api/admin/campaigns/${editing._id}`, payload)
                : await axios.post('/api/admin/campaigns', payload);

            if (res.data?.flag) {
                toastSuccess(res.data?.msg || (isEdit ? 'Campaign updated successfully.' : 'Campaign created successfully.'));
                setCampaignModal(null);

                if (!isEdit && pagination.currentPage !== DEFAULT_CURRENT_PAGE) {
                    setPagination((p) => ({ ...p, currentPage: DEFAULT_CURRENT_PAGE }));
                } else {
                    await fetchCampaigns();
                };
            } else {
                toastError(res.data?.msg || res.data?.message || 'Failed to save campaign.');
            };
        } catch (err) {
            toastError(err.response?.data?.msg || err.response?.data?.message || 'Failed to save campaign.');
        } finally {
            setSaving(false);
        };
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;

        setDeleting(true);
        try {
            const res = await axios.delete(`/api/admin/campaigns/${deleteTarget._id}`);

            if (res.data?.flag) {
                toastSuccess(res.data?.msg || 'Campaign deleted successfully.');
                const wasLastOnPage = campaigns.length === 1 && pagination.currentPage > DEFAULT_CURRENT_PAGE;
                setDeleteTarget(null);

                if (wasLastOnPage) {
                    setPagination((p) => ({ ...p, currentPage: p.currentPage - 1 }));
                } else {
                    await fetchCampaigns();
                };
            } else {
                toastError(res.data?.msg || res.data?.message || 'Failed to delete campaign.');
            };
        } catch (err) {
            toastError(err.response?.data?.msg || err.response?.data?.message || 'Failed to delete campaign.');
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
                        <Megaphone size={16} /> Campaign Management
                    </div>
                    <h1 style={{ color: '#212529', fontSize: '1.6rem', fontWeight: 900, margin: 0 }}>All Campaigns</h1>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <button
                        type="button"
                        onClick={fetchCampaigns}
                        disabled={loading}
                        style={{ background: '#F5F9FC', border: '1px solid #D8DFE4', color: '#212529', padding: '0.6rem 1.25rem', borderRadius: '12px', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: 700 }}
                    >
                        <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Refresh
                    </button>
                    <button
                        type="button"
                        onClick={() => setCampaignModal({ campaign: null })}
                        style={{ background: 'linear-gradient(135deg, #0D6EFD 0%, #0a58ca 100%)', border: 'none', color: '#FFFFFF', padding: '0.6rem 1.25rem', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: 700 }}
                    >
                        <Plus size={15} /> New Campaign
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
                            placeholder="Search by campaign name..."
                            style={{ width: '100%', ...selectStyle, paddingLeft: '2.4rem', cursor: 'text' }}
                        />
                    </div>
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
                                <th style={{ padding: '0.9rem 1rem', fontWeight: 600 }}>Campaign Name</th>
                                <th style={{ padding: '0.9rem 1rem', fontWeight: 600 }}>Rewards</th>
                                <th style={{ padding: '0.9rem 1rem', fontWeight: 600 }}>Comments</th>
                                <th style={{ padding: '0.9rem 1rem', fontWeight: 600 }}>Created</th>
                                <th style={{ padding: '0.9rem 1rem', fontWeight: 600, textAlign: 'center' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                                        <div style={{ width: '32px', height: '32px', border: '3px solid rgba(13,110,253,0.3)', borderTop: '3px solid #0D6EFD', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 0.75rem' }} />
                                        <span>Fetching campaigns...</span>
                                    </td>
                                </tr>
                            ) : campaigns.length === 0 ? (
                                <tr>
                                    <td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                                        No campaigns found. Click &ldquo;New Campaign&rdquo; to create one.
                                    </td>
                                </tr>
                            ) : campaigns.map((campaign) => {
                                const comments = Array.isArray(campaign.comments) ? campaign.comments : [];
                                const firstComment = comments[0] || '';
                                const extraCount = comments.length - 1;

                                return (
                                    <tr key={campaign._id} style={{ borderBottom: '1px solid #DEE2E6', transition: 'background 0.15s' }} className="hover:bg-gray-50">
                                        {/* Name */}
                                        <td style={{ padding: '0.85rem 1rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(13,110,253,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                    <Megaphone size={17} style={{ color: '#0D6EFD' }} />
                                                </div>
                                                <div style={{ color: '#212529', fontWeight: 700, fontSize: '0.88rem' }}>{campaign.name}</div>
                                            </div>
                                        </td>
                                        {/* Rewards */}
                                        <td style={{ padding: '0.85rem 1rem', fontWeight: 800, color: '#0D6EFD' }}>
                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                                                <Gift size={14} /> {formatRewards(campaign.rewards)}
                                            </span>
                                        </td>
                                        {/* Comments */}
                                        <td style={{ padding: '0.85rem 1rem', maxWidth: '320px' }}>
                                            {comments.length === 0 ? (
                                                <span style={{ color: '#94a3b8' }}>—</span>
                                            ) : (
                                                <div title={comments.join('\n')}>
                                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: 'rgba(13,110,253,0.1)', color: '#0D6EFD', border: '1px solid rgba(13,110,253,0.25)', padding: '0.15rem 0.55rem', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 700 }}>
                                                        <MessageSquare size={11} /> {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
                                                    </span>
                                                    <div style={{ color: '#64748b', fontSize: '0.76rem', marginTop: '0.3rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                        {firstComment}{extraCount > 0 ? ` (+${extraCount} more)` : ''}
                                                    </div>
                                                </div>
                                            )}
                                        </td>
                                        {/* Created */}
                                        <td style={{ padding: '0.85rem 1rem', color: '#64748b', fontSize: '0.78rem' }}>
                                            {moment(campaign.createdAt).format('MMM DD, YYYY')}
                                        </td>
                                        {/* Actions */}
                                        <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                                                <button
                                                    type="button"
                                                    title="Edit Campaign"
                                                    onClick={() => setCampaignModal({ campaign })}
                                                    style={actionButtonStyle('primary')}
                                                >
                                                    <Pencil size={13} /> Edit
                                                </button>
                                                <button
                                                    type="button"
                                                    title="Delete Campaign"
                                                    onClick={() => setDeleteTarget(campaign)}
                                                    style={actionButtonStyle('danger')}
                                                >
                                                    <Trash2 size={13} /> Delete
                                                </button>
                                            </div>
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
                    itemLabel="campaigns"
                />
            </div>

            {/* Modals */}
            {campaignModal && (
                <CampaignModal
                    campaign={campaignModal.campaign}
                    onConfirm={handleSave}
                    onClose={() => setCampaignModal(null)}
                    loading={saving}
                />
            )}

            {deleteTarget && (
                <ConfirmModal
                    title="Delete Campaign"
                    subtitle={deleteTarget.name}
                    message={`Are you sure you want to delete the campaign "${deleteTarget.name}"? This action cannot be undone.`}
                    confirmLabel="Delete Campaign"
                    loading={deleting}
                    onConfirm={handleDelete}
                    onClose={() => setDeleteTarget(null)}
                />
            )}
        </div>
    );
};
