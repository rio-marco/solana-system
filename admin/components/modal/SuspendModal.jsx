'use client';

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import moment from 'moment';
import Link from 'next/link';
import {
    ShieldOff,
    X,
    AlertTriangle,
} from 'lucide-react';

import {
    USER_STATUS,
} from '../ui-constants.mjs';

export default function SuspendModal({ user, onConfirm, onClose, loading }) {
    const [reason, setReason] = useState('');

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <div style={{ background: '#FFFFFF', border: '1px solid #DEE2E6', borderRadius: '6px', width: '100%', maxWidth: '480px', padding: '2rem', boxShadow: '0 25px 60px rgba(0,0,0,0.7)' }}>
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
                    {/* <button type="button" onClick={onClose} style={{ background: '#000000', border: '1px solid #DEE2E6', color: '#FFFFFF', padding: '0.4rem', borderRadius: '8px', cursor: 'pointer' }}>
                        <X size={16} />
                    </button> */}
                </div>

                <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '12px', padding: '0.85rem 1rem', marginBottom: '1.25rem' }}>
                    <p style={{ color: '#212529', fontSize: '0.83rem', margin: 0, lineHeight: 1.5 }}>
                        This will immediately restrict the user&apos;s access to the platform. Please provide a reason for suspension.
                    </p>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', color: '#171D25', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                        Suspension Reason <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Enter reason for suspension (e.g., Suspicious activity, Terms violation...)"
                        rows={3}
                        style={{
                            width: '100%',
                            background: '#FFFFFF',
                            border: '1px solid #DEE2E6',
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
                        style={{ flex: 1, padding: '0.75rem', borderRadius: '12px', background: '#0D6EFD', border: '1px solid #DEE2E6', color: '#FFFFFF', fontWeight: 600, cursor: 'pointer', fontSize: '0.88rem' }}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={() => onConfirm({ statusVal: USER_STATUS.SUSPENDED, reason: reason.trim() })}
                        disabled={loading || reason.trim().length < 3}
                        style={{ flex: 1, padding: '0.75rem', borderRadius: '12px', background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', border: 'none', color: '#FFFFFF', fontWeight: 700, cursor: reason.trim().length < 3 || loading ? 'not-allowed' : 'pointer', fontSize: '0.88rem', opacity: reason.trim().length < 3 || loading ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                    >
                        <ShieldOff size={15} />
                        {loading ? 'Suspending...' : 'Confirm Suspend'}
                    </button>
                </div>
            </div>
        </div>
    );
};