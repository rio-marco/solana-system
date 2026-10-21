'use client';

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import moment from 'moment';
import {
    Megaphone,
    RefreshCw,
    ChevronRight,
} from 'lucide-react';
import {
    ACTIVITY_STATUS,
    DEFAULT_CURRENT_PAGE,
    DEFAULT_ITEM_PER_PAGE,
} from './ui-constants.mjs';
import { Pagination } from './Pagination';
import { CampaignModal } from './CampaignModal';
import { ActivityStatusBadge } from './ActivityStatusBadge';

export const CampaignList = () => {
    const [campaigns, setCampaigns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isFetchingPage, setIsFetchingPage] = useState(false);
    const [selectedCampaign, setSelectedCampaign] = useState(null);

    const [pagination, setPagination] = useState({
        totalCount: 0,
        totalPages: 0,
        currentPage: DEFAULT_CURRENT_PAGE,
        limit: DEFAULT_ITEM_PER_PAGE,
    });

    const fetchCampaigns = useCallback(async (pageToFetch) => {
        setIsFetchingPage(true);

        try {
            const params = {
                page: pagination.currentPage,
                limit: pagination.limit,
            };

            const res = await axios.get('/api/campaign/list', { params });
            // const res = await axios.get(`/api/campaign/list?page=${p}&limit=${limit}`);
            if (res.data && res.data.flag && res.data.data) {
                const d = res.data.data;

                setCampaigns(d.campaigns || []);
                setPagination(p => ({
                    ...p,
                    totalCount: d.totalCount || 0,
                    totalPages: d.totalPages || 0,
                }));
            } else {
                setCampaigns([]);
            };
        } catch (err) {
            console.error('Failed to fetch campaigns:', err);
            setCampaigns([]);
        } finally {
            setLoading(false);
            setIsFetchingPage(false);
        };
    }, [pagination.currentPage, pagination.limit]);

    useEffect(() => {
        fetchCampaigns();
    }, [fetchCampaigns]);

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

    const handleCampaignUsed = (campaignId, status, commentUrl) => {
        setCampaigns(prev => prev.map(c => (
            c._id === campaignId
                ? {
                    ...c,
                    status: status === undefined || status === null ? ACTIVITY_STATUS.PENDING : status,
                    comment_url: commentUrl || c.comment_url,
                }
                : c
        )));
    };

    return (
        <div style={{ background: 'rgba(15, 20, 34, 0.85)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '24px', padding: '1.5rem 1.75rem', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Megaphone size={20} style={{ color: '#F59E0B' }} />
                    <span>Campaigns</span>
                </h2>
                <button
                    type="button"
                    onClick={fetchCampaigns}
                    disabled={loading || isFetchingPage}
                    className="solana-btn-outline"
                    style={{ width: 'auto', padding: '0 0.85rem', height: '34px', fontSize: '0.78rem' }}
                >
                    <RefreshCw size={13} className={isFetchingPage ? 'animate-spin' : ''} />
                    <span>Refresh</span>
                </button>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem 0', color: '#64748b', fontSize: '0.85rem' }}>
                    Loading campaigns...
                </div>
            ) : campaigns.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 0', color: '#64748b', fontSize: '0.85rem' }} className="font-mono">
                    No campaigns available yet.
                </div>
            ) : (
                <>
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                            gap: '1rem',
                            opacity: isFetchingPage ? 0.35 : 1,
                            transition: 'opacity 0.2s ease',
                        }}
                    >
                        {campaigns.map((c) => {
                            const isSubmitted = c.status !== null && c.status !== undefined;

                            return (
                                <button
                                    key={c._id}
                                    type="button"
                                    onClick={() => setSelectedCampaign(c)}
                                    style={{
                                        background: 'rgba(7, 9, 14, 0.6)',
                                        border: '1px solid rgba(255, 255, 255, 0.08)',
                                        borderRadius: '18px',
                                        padding: '1.15rem',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'stretch',
                                        justifyContent: 'space-between',
                                        gap: '0.85rem',
                                        cursor: 'pointer',
                                        textAlign: 'left',
                                        transition: 'all 0.2s ease',
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
                                        <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#ffffff', margin: 0, wordBreak: 'break-word' }}>
                                            {c.name}
                                        </h3>
                                        <ChevronRight size={18} style={{ color: '#64748b', flexShrink: 0 }} />
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
                                        {isSubmitted ? (
                                            <ActivityStatusBadge status={c.status} />
                                        ) : (
                                            <span
                                                style={{
                                                    padding: '0.2rem 0.5rem',
                                                    borderRadius: '20px',
                                                    fontSize: '0.68rem',
                                                    fontWeight: 700,
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.4px',
                                                    whiteSpace: 'nowrap',
                                                    background: 'rgba(148,163,184,0.12)',
                                                    color: '#94a3b8',
                                                    border: '1px solid rgba(148,163,184,0.25)',
                                                }}
                                            >
                                                Available
                                            </span>
                                        )}

                                        {isSubmitted && c.submitted_at ? (
                                            <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 600 }}>
                                                Submitted {moment(c.submitted_at).format('MMM DD, YYYY')}
                                            </span>
                                        ) : null}
                                    </div>
                                </button>
                            );
                        })}
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
                </>
            )}

            {selectedCampaign && (
                <CampaignModal
                    key={selectedCampaign._id}
                    campaign={selectedCampaign}
                    onClose={() => setSelectedCampaign(null)}
                    onUsed={handleCampaignUsed}
                />
            )}
        </div>
    );
};