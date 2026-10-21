'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import {
    X,
    Gift,
    MessageSquare,
    Calendar,
    Megaphone,
    Shuffle,
    Copy,
    Check,
    Link2,
    Info,
    Send,
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { copyTextToClipboard } from '../lib/clipboard';
import { ACTIVITY_STATUS } from './ui-constants.mjs';
import { ActivityStatusBadge } from './ActivityStatusBadge';

const pickRandomCommit = (comments) => {
    if (!Array.isArray(comments) || comments.length === 0) return null;
    return comments[Math.floor(Math.random() * comments.length)];
};

export const CampaignModal = ({ campaign, onClose, onUsed }) => {
    const { toastError, toastSuccess } = useToast();

    const comments = useMemo(
        () => (Array.isArray(campaign?.comments) ? campaign.comments : []),
        [campaign],
    );

    const activityStatus = campaign?.status ?? null;
    const isSubmitted = activityStatus !== null && activityStatus !== undefined;
    const submittedUrl = campaign?.comment_url || '';

    const [selectedCommit, setSelectedCommit] = useState(() => pickRandomCommit(comments));
    const [commentUrl, setCommentUrl] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [copied, setCopied] = useState(false);
    const [copiedUrl, setCopiedUrl] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!campaign || !mounted) return null;

    const cardStyle = {
        background: 'rgba(7, 9, 14, 0.6)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '16px',
        padding: '0.9rem 1rem',
    };

    const infoMessage = !isSubmitted
        ? 'Each campaign can be used only once. After you submit, this campaign stays in your list with a Pending status until verification.'
        : activityStatus === ACTIVITY_STATUS.PENDING
            ? 'You have already submitted this campaign. The submitted URL is locked and cannot be changed. Your submission is pending verification.'
            : activityStatus === ACTIVITY_STATUS.VERIFIED
                ? 'This campaign has been verified. The submitted URL is locked and cannot be changed.'
                : 'Your submission for this campaign was rejected. The submitted URL is locked and cannot be changed.';

    const handleShuffle = () => {
        if (comments.length <= 1) return;
        let next = selectedCommit;
        while (next === selectedCommit && comments.length > 1) {
            next = pickRandomCommit(comments);
        };
        setSelectedCommit(next);
        setCopied(false);
    };

    const handleCopyCommit = async () => {
        if (!selectedCommit) return;
        const ok = await copyTextToClipboard(selectedCommit);
        if (ok) {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        };
    };

    const handleCopySubmittedUrl = async () => {
        if (!submittedUrl) return;
        const ok = await copyTextToClipboard(submittedUrl);
        if (ok) {
            setCopiedUrl(true);
            setTimeout(() => setCopiedUrl(false), 2000);
        };
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (isSubmitted) return;

        const trimmed = commentUrl.trim();
        if (!trimmed) {
            toastError('Please paste your commit URL.');
            return;
        };

        if (!/^https?:\/\//i.test(trimmed)) {
            toastError('Please enter a valid commit URL (starting with http:// or https://).');
            return;
        };

        setSubmitting(true);
        try {
            const res = await axios.post('/api/campaign/use', {
                campaignId: campaign._id,
                commentUrl: trimmed,
            });

            if (res.data && res.data.flag) {
                toastSuccess(res.data.msg || 'Campaign submitted successfully.');
                if (onUsed) onUsed(campaign._id, res.data?.data?.status ?? ACTIVITY_STATUS.PENDING, trimmed);
                onClose();
            } else {
                toastError(res.data?.msg || 'Failed to submit campaign.');
            };
        } catch (err) {
            toastError(err.response?.data?.msg || err.response?.data?.message || 'Failed to submit campaign.');
        } finally {
            setSubmitting(false);
        };
    };

    return createPortal(
        <div className="solana-modal-overlay" onClick={onClose}>
            <div className="solana-modal-card" style={{ maxWidth: '650px' }} onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div
                    style={{
                        position: 'sticky',
                        top: 0,
                        zIndex: 5,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderBottom: '1px solid rgba(255,255,255,0.1)',
                        paddingBottom: '1.5rem',
                        marginBottom: '1.25rem',
                        background: 'var(--bg-card)',
                        borderRadius: '24px 24px 0 0',
                        gap: '0.75rem',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', minWidth: 0 }}>
                        <Megaphone style={{ color: '#F59E0B', flexShrink: 0 }} size={20} />
                        <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff', margin: 0, wordBreak: 'break-word' }}>
                            Campaign Details
                        </h3>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', flexShrink: 0 }}>
                        <X size={20} />
                    </button>
                </div>

                {/* Details */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
                    <div style={cardStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#64748b', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            <Gift size={13} />
                            <span>Campaign Name</span>
                        </div>
                        <div style={{ color: '#ffffff', fontSize: '0.85rem', fontWeight: 600, marginTop: '0.35rem' }}>
                            {campaign.name}
                        </div>
                    </div>
                    <div style={cardStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#64748b', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            <Gift size={13} />
                            <span>Rewards</span>
                        </div>
                        <div style={{ color: '#14F195', fontSize: '1rem', fontWeight: 800, marginTop: '0.35rem' }}>
                            {Number(campaign.rewards).toLocaleString(undefined, { maximumFractionDigits: 8 })} BTCR
                        </div>
                    </div>
                    <div style={cardStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#64748b', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            <MessageSquare size={13} />
                            <span>Commits</span>
                        </div>
                        <div style={{ color: '#ffffff', fontSize: '1rem', fontWeight: 800, marginTop: '0.35rem' }}>
                            {selectedCommit ? 1 : 0}
                        </div>
                    </div>
                    <div style={cardStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#64748b', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            <Info size={13} />
                            <span>Status</span>
                        </div>
                        <div style={{ marginTop: '0.35rem' }}>
                            {isSubmitted ? (
                                <ActivityStatusBadge status={activityStatus} />
                            ) : (
                                <span style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: 600 }}>Not Submitted</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Random Commit / Task */}
                <div style={{ marginBottom: '2rem', marginTop: '2rem' }}>
                    {/* <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                        <span className="solana-input-label" style={{ margin: 0 }}>Your Task (Commit)</span>
                        {comments.length > 1 && (
                            <button
                                type="button"
                                onClick={handleShuffle}
                                title="Show another commit"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: 'transparent', border: 'none', color: '#00C2FF', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                            >
                                <Shuffle size={13} />
                                <span>Shuffle</span>
                            </button>
                        )}
                    </div> */}

                    {selectedCommit ? (
                        <div style={{ ...cardStyle, borderColor: 'rgba(20, 241, 149, 0.25)', background: 'rgba(20, 241, 149, 0.06)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem' }}>
                            <p style={{ margin: 0, color: '#e2e8f0', fontSize: '0.88rem', lineHeight: 1.5, wordBreak: 'break-word' }}>
                                {selectedCommit}
                            </p>
                            <button
                                type="button"
                                onClick={handleCopyCommit}
                                title="Copy commit"
                                style={{ background: 'none', border: 'none', color: copied ? '#14F195' : '#94a3b8', cursor: 'pointer', flexShrink: 0 }}
                            >
                                {copied ? <Check size={16} /> : <Copy size={16} />}
                            </button>
                        </div>
                    ) : (
                        <div style={{ ...cardStyle, color: '#64748b', fontSize: '0.82rem' }}>
                            No commit instructions available for this campaign.
                        </div>
                    )}
                </div>

                {/* Submit proof */}
                <form onSubmit={handleSubmit}>
                    <div className="form-group-custom">
                        <label className="solana-input-label">
                            {isSubmitted ? 'Submitted comment URL' : 'Paste your commit / comment URL'}
                        </label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <div className="solana-input-icon-wrapper" style={{ flex: 1, minWidth: 0 }}>
                                <Link2 className="input-svg-icon" />
                                <input
                                    type="url"
                                    className="solana-input-field"
                                    placeholder="https://..."
                                    value={isSubmitted ? submittedUrl : commentUrl}
                                    onChange={(e) => setCommentUrl(e.target.value)}
                                    disabled={isSubmitted || submitting}
                                    readOnly={isSubmitted}
                                    required={!isSubmitted}
                                />
                            </div>

                            {isSubmitted && submittedUrl ? (
                                <button
                                    type="button"
                                    onClick={handleCopySubmittedUrl}
                                    title="Copy submitted URL"
                                    style={{ background: 'none', border: 'none', color: copiedUrl ? '#14F195' : '#94a3b8', cursor: 'pointer', flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                                >
                                    {copiedUrl ? <Check size={16} /> : <Copy size={16} />}
                                </button>
                            ) : null}
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', color: '#94a3b8', fontSize: '0.75rem', lineHeight: 1.45, marginBottom: '1.25rem' }}>
                        <Info size={14} style={{ color: '#00C2FF', flexShrink: 0, marginTop: '2px' }} />
                        <span>{infoMessage}</span>
                    </div>

                    {!isSubmitted ? (
                        <div
                            style={{
                                display: 'flex',
                                gap: '0.75rem',
                                justifyContent: 'flex-end',
                                borderTop: '1px solid rgba(255,255,255,0.1)',
                                paddingTop: '1.8rem',
                                marginTop: '2.25rem',
                            }}
                        >
                            <button type="button" onClick={onClose} className="solana-btn-outline" style={{ width: 'auto', padding: '0 1.25rem' }} disabled={submitting}>
                                Cancel
                            </button>
                            <button type="submit" className="solana-btn-primary" style={{ width: 'auto', padding: '0 1.25rem' }} disabled={submitting}>
                                {submitting ? (
                                    <span>Submitting...</span>
                                ) : (
                                    <>
                                        <Send size={15} />
                                        <span>Submit &amp; Use</span>
                                    </>
                                )}
                            </button>
                        </div>
                    ) : null}
                </form>
            </div>
        </div>,
        document.body,
    );
};