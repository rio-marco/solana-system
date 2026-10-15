'use client';

import React from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';

export default function ConfirmModal({
    title = 'Confirm',
    subtitle = '',
    message = 'Are you sure you want to proceed?',
    confirmLabel = 'Confirm',
    loading = false,
    onConfirm,
    onClose,
}) {
    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <div style={{ background: '#FFFFFF', border: '1px solid #DEE2E6', borderRadius: '6px', width: '100%', maxWidth: '460px', padding: '2rem', boxShadow: '0 25px 60px rgba(0,0,0,0.7)' }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.5rem' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <AlertTriangle size={20} style={{ color: '#ef4444' }} />
                    </div>
                    <div>
                        <h3 style={{ color: '#212529', fontWeight: 800, fontSize: '1.05rem', margin: 0 }}>{title}</h3>
                        {subtitle && <p style={{ color: '#94a3b8', fontSize: '0.78rem', margin: 0 }}>{subtitle}</p>}
                    </div>
                </div>

                <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '12px', padding: '0.85rem 1rem', marginBottom: '1.5rem' }}>
                    <p style={{ color: '#212529', fontSize: '0.85rem', margin: 0, lineHeight: 1.5 }}>{message}</p>
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
                        onClick={onConfirm}
                        disabled={loading}
                        style={{ flex: 1, padding: '0.75rem', borderRadius: '12px', background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', border: 'none', color: '#FFFFFF', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontSize: '0.88rem', opacity: loading ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                    >
                        <Trash2 size={15} />
                        {loading ? 'Deleting...' : confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
};
