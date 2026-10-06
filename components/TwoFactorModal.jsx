'use client';

import React, { useState } from 'react';
import axios from 'axios';
import { ShieldCheck, AlertCircle, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';

export const TwoFactorModal = ({ isOpen, onClose, email, tempUserId }) => {
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { checkAuth } = useAuth();
    const router = useRouter();

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if (!code || code.length !== 6) {
            setError('Please enter a 6-digit authenticator code.');
            return;
        };

        try {
            setLoading(true);
            const res = await axios.post('/api/auth/verify-2fa-code', { email, code, tempUserId });
            if (res.data && res.data.flag) {
                await checkAuth();
                onClose();
                router.push('/');
            } else {
                setError(res.data.message || 'Invalid 2FA authentication code.');
            };
        } catch (err) {
            setError(err.response?.data?.message || 'Verification failed. Try again.');
        } finally {
            setLoading(false);
        };
    };

    return (
        <div className="solana-modal-overlay">
            <div className="solana-modal-card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <ShieldCheck style={{ color: '#9945FF' }} size={20} />
                        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff' }}>Two-Factor Verification</h3>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', marginLeft: 'auto' }}>
                        <X size={20} />
                    </button>
                </div>

                <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '1rem' }}>
                    Enter the 6-digit code from your Authenticator app to complete sign-in.
                </p>

                {error && (
                    <div className="solana-alert-danger">
                        <AlertCircle size={18} />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="form-group-custom">
                        <label className="solana-input-label">2FA Code</label>
                        <input
                            type="text"
                            maxLength={6}
                            className="solana-input-field otp-input-field"
                            placeholder="000000"
                            value={code}
                            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                            autoFocus
                        />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                        <button type="button" onClick={onClose} className="solana-btn-outline" style={{ width: 'auto', padding: '0 1.25rem' }}>
                            Cancel
                        </button>
                        <button type="submit" disabled={loading} className="solana-btn-primary" style={{ width: 'auto', padding: '0 1.5rem' }}>
                            {loading ? 'Verifying...' : 'Verify & Sign In'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};