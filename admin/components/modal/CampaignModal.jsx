'use client';

import React, { useState } from 'react';
import {
    Megaphone,
    Save,
    Plus,
    Trash2,
    Gift,
    MessageSquare,
} from 'lucide-react';
import { CAMPAIGN } from '../ui-constants.mjs';

export default function CampaignModal({ campaign, onConfirm, onClose, loading }) {
    const isEdit = Boolean(campaign?._id);

    const [name, setName] = useState(campaign?.name || '');
    const [rewards, setRewards] = useState(
        campaign?.rewards !== undefined && campaign?.rewards !== null ? String(campaign.rewards) : ''
    );
    const [comments, setComments] = useState(
        Array.isArray(campaign?.comments) && campaign.comments.length > 0 ? [...campaign.comments] : ['']
    );

    const inputStyle = {
        width: '100%',
        background: '#FFFFFF',
        border: '1px solid #DEE2E6',
        borderRadius: '12px',
        padding: '0.75rem 1rem',
        color: '#212529',
        fontSize: '0.88rem',
        outline: 'none',
        fontFamily: 'inherit',
    };

    const addComment = () => {
        setComments((prev) => (prev.length >= CAMPAIGN.MAX_COMMENTS ? prev : [...prev, '']));
    };

    const updateComment = (index, value) => {
        setComments((prev) => prev.map((c, i) => (i === index ? value : c)));
    };

    const removeComment = (index) => {
        setComments((prev) => prev.filter((_, i) => i !== index));
    };

    const cleanName = name.trim();
    const isNameValid = cleanName.length >= CAMPAIGN.NAME_MIN_LENGTH && cleanName.length <= CAMPAIGN.NAME_MAX_LENGTH;

    const rewardsTrimmed = String(rewards).trim();
    const rewardsNum = Number(rewardsTrimmed);
    const isRewardsValid = rewardsTrimmed !== '' && Number.isFinite(rewardsNum) && rewardsNum >= 0;

    const cleanComments = comments.map((c) => c.trim()).filter((c) => c !== '');
    const hasOverlongComment = cleanComments.some((c) => c.length > CAMPAIGN.COMMENT_MAX_LENGTH);

    const disabled = loading || !isNameValid || !isRewardsValid || hasOverlongComment;

    const handleSubmit = () => {
        if (disabled) return;
        onConfirm({
            name: cleanName,
            rewards: rewardsNum,
            comments: cleanComments,
        });
    };

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <div style={{ background: '#FFFFFF', border: '1px solid #DEE2E6', borderRadius: '10px', width: '100%', maxWidth: '560px', padding: '2rem', boxShadow: '0 25px 60px rgba(0,0,0,0.7)', maxHeight: '90vh', overflowY: 'auto' }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.5rem' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(13,110,253,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Megaphone size={20} style={{ color: '#0D6EFD' }} />
                    </div>
                    <div>
                        <h3 style={{ color: '#212529', fontWeight: 800, fontSize: '1.05rem', margin: 0 }}>
                            {isEdit ? 'Edit Campaign' : 'Create Campaign'}
                        </h3>
                        <p style={{ color: '#94a3b8', fontSize: '0.78rem', margin: 0 }}>
                            {isEdit ? 'Update campaign details below' : 'Fill in the details to launch a new campaign'}
                        </p>
                    </div>
                </div>

                {/* Campaign Name */}
                <div style={{ marginBottom: '1.25rem' }}>
                    <label style={{ display: 'block', color: '#171D25', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                        Campaign Name <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                        type="text"
                        value={name}
                        maxLength={CAMPAIGN.NAME_MAX_LENGTH}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Summer Deposit Bonus"
                        style={{ ...inputStyle, border: `1px solid ${name && !isNameValid ? '#ef4444' : '#DEE2E6'}` }}
                    />
                    {name && !isNameValid && (
                        <p style={{ color: '#ef4444', fontSize: '0.75rem', margin: '0.4rem 0 0' }}>
                            Name must be between {CAMPAIGN.NAME_MIN_LENGTH} and {CAMPAIGN.NAME_MAX_LENGTH} characters.
                        </p>
                    )}
                </div>

                {/* Rewards */}
                <div style={{ marginBottom: '1.25rem' }}>
                    <label style={{ display: 'block', color: '#171D25', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                        Rewards (in BTCR) <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <div style={{ position: 'relative' }}>
                        <Gift size={15} style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                        <input
                            type="number"
                            min="0"
                            step="any"
                            value={rewards}
                            onChange={(e) => setRewards(e.target.value)}
                            placeholder="e.g. 100"
                            style={{ ...inputStyle, paddingLeft: '2.4rem', border: `1px solid ${rewardsTrimmed !== '' && !isRewardsValid ? '#ef4444' : '#DEE2E6'}` }}
                        />
                    </div>
                    {rewardsTrimmed !== '' && !isRewardsValid && (
                        <p style={{ color: '#ef4444', fontSize: '0.75rem', margin: '0.4rem 0 0' }}>
                            Rewards must be a valid non-negative number.
                        </p>
                    )}
                </div>

                {/* Comments */}
                <div style={{ marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#171D25', fontSize: '0.8rem', fontWeight: 600 }}>
                            <MessageSquare size={14} /> Comments
                        </label>
                        <button
                            type="button"
                            onClick={addComment}
                            disabled={comments.length >= CAMPAIGN.MAX_COMMENTS}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: '#E7F1FF', border: '1px solid #9EC5FE', color: '#0D6EFD', padding: '0.35rem 0.7rem', borderRadius: '8px', cursor: comments.length >= CAMPAIGN.MAX_COMMENTS ? 'not-allowed' : 'pointer', fontSize: '0.75rem', fontWeight: 600, opacity: comments.length >= CAMPAIGN.MAX_COMMENTS ? 0.6 : 1 }}
                        >
                            <Plus size={13} /> Add Comment
                        </button>
                    </div>

                    {comments.length === 0 ? (
                        <p style={{ color: '#94a3b8', fontSize: '0.78rem', margin: 0, padding: '0.75rem 0' }}>
                            No comments added. Click &ldquo;Add Comment&rdquo; to add one.
                        </p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {comments.map((comment, index) => (
                                <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 700, width: '18px', textAlign: 'right', flexShrink: 0 }}>{index + 1}.</span>
                                    <input
                                        type="text"
                                        value={comment}
                                        maxLength={CAMPAIGN.COMMENT_MAX_LENGTH}
                                        onChange={(e) => updateComment(index, e.target.value)}
                                        placeholder="Enter a comment..."
                                        style={{ ...inputStyle, border: `1px solid ${comment.length > CAMPAIGN.COMMENT_MAX_LENGTH ? '#ef4444' : '#DEE2E6'}` }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeComment(index)}
                                        title="Remove comment"
                                        style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', width: '36px', height: '36px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                                    >
                                        <Trash2 size={15} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                    <p style={{ color: '#94a3b8', fontSize: '0.72rem', margin: '0.5rem 0 0' }}>
                        Each comment can be up to {CAMPAIGN.COMMENT_MAX_LENGTH} characters. Empty comments are ignored.
                    </p>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        style={{ flex: 1, padding: '0.75rem', borderRadius: '12px', background: '#F5F9FC', border: '1px solid #D8DFE4', color: '#212529', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', fontSize: '0.88rem' }}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={disabled}
                        style={{ flex: 1, padding: '0.75rem', borderRadius: '12px', background: 'linear-gradient(135deg, #0D6EFD 0%, #0a58ca 100%)', border: 'none', color: '#FFFFFF', fontWeight: 700, cursor: disabled ? 'not-allowed' : 'pointer', fontSize: '0.88rem', opacity: disabled ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                    >
                        <Save size={15} />
                        {loading ? 'Saving...' : (isEdit ? 'Save Changes' : 'Create Campaign')}
                    </button>
                </div>
            </div>
        </div>
    );
};