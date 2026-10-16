'use client';

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
    Megaphone,
    Gift,
    MessageSquare,
    RefreshCw,
    Calendar,
} from 'lucide-react';
import {
    DEFAULT_CURRENT_PAGE,
    DEFAULT_ITEM_PER_PAGE,
} from './ui-constants.mjs';
import { Pagination } from './Pagination';

export const CampaignList = () => {
    const [campaigns, setCampaigns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isFetchingPage, setIsFetchingPage] = useState(false);

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
                        {campaigns.map((c) => (
                            <div
                                key={c._id}
                                style={{
                                    background: 'rgba(7, 9, 14, 0.6)',
                                    border: '1px solid rgba(255, 255, 255, 0.08)',
                                    borderRadius: '18px',
                                    padding: '1.15rem',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '0.75rem',
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
                                    <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#ffffff', margin: 0, wordBreak: 'break-word' }}>
                                        {c.name}
                                    </h3>
                                    <span
                                        style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '0.3rem',
                                            padding: '0.2rem 0.6rem',
                                            borderRadius: '20px',
                                            background: 'rgba(245,158,11,0.15)',
                                            border: '1px solid rgba(245,158,11,0.35)',
                                            color: '#F59E0B',
                                            fontSize: '0.72rem',
                                            fontWeight: 800,
                                            flexShrink: 0,
                                        }}
                                    >
                                        <Gift size={12} />
                                        {c.rewards} BTCR
                                    </span>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', fontSize: '0.75rem', color: '#94a3b8' }}>
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                                        <MessageSquare size={13} style={{ color: '#14F195' }} />
                                        {Array.isArray(c.comments) ? c.comments.length : 0} tasks
                                    </span>
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }} className="font-mono">
                                        <Calendar size={13} style={{ color: '#00C2FF' }} />
                                        {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '-'}
                                    </span>
                                </div>

                                {Array.isArray(c.comments) && c.comments.length > 0 && (
                                    <ul style={{ margin: 0, paddingLeft: '1.1rem', color: '#cbd5e1', fontSize: '0.78rem', lineHeight: 1.6 }}>
                                        {c.comments.slice(0, 3).map((comment, idx) => (
                                            <li key={idx} style={{ wordBreak: 'break-word' }}>{comment}</li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        ))}
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
        </div>
    );
};