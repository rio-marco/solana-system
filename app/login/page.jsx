'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Coins, Mail, LogIn, Key, AlertCircle, Info } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { RecoveryModal } from '../../components/RecoveryModal';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showRecovery, setShowRecovery] = useState(false);
    const { user, loading: authLoading } = useAuth();
    const { toastError, toastSuccess } = useToast();
    const router = useRouter();

    useEffect(() => {
        if (!authLoading && user) {
            router.push('/');
        };
    }, [user, authLoading, router]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if (!email || !email.trim()) {
            const msg = 'Please enter your email address.';
            setError(msg);
            toastError(msg);
            return;
        };

        try {
            setLoading(true);
            const res = await axios.post('/api/auth/login', { email: email.trim() });
            if (res.data && res.data.flag) {
                toastSuccess(res.data.msg || 'OTP sent to your email address.');
                router.push(`/verify-otp?email=${encodeURIComponent(email.trim())}`);
            } else {
                if (res.data && res.data.data && res.data.data.redirectUrl) {
                    router.push(res.data.data.redirectUrl);
                } else {
                    const msg = res.data?.msg || res.data?.message || 'Login request failed.';
                    setError(msg);
                    toastError(msg);
                };
            };
        } catch (err) {
            if (err.response?.data?.data?.redirectUrl) {
                router.push(err.response.data.data.redirectUrl);
            } else {
                const msg = err.response?.data?.msg || err.response?.data?.message || 'Invalid login attempt.';
                setError(msg);
                toastError(msg);
            };
        } finally {
            setLoading(false);
        };
    };

    if (authLoading) {
        return (
            <div className="min-h-screen bg-dark flex flex-col items-center justify-center text-purple-400 gap-3 font-mono text-sm">
                <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
                <span>Loading...</span>
            </div>
        );
    };

    return (
        <div className="auth-page-wrapper">
            <div className="solana-auth-card">
                <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
                    <div className="solana-brand-pill" style={{ marginBottom: '0.75rem' }}>
                        <Coins size={15} />
                        <span>Solana Platform</span>
                    </div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.35rem' }}>
                        Welcome Back
                    </h2>
                    <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                        Sign in to manage your SOL deposits and withdrawals
                    </p>
                </div>

                {error && (
                    <div className="solana-alert-danger">
                        <AlertCircle size={18} style={{ flexShrink: 0 }} />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="form-group-custom">
                        <label className="solana-input-label">Email Address</label>
                        <div className="solana-input-icon-wrapper">
                            <Mail className="input-svg-icon" />
                            <input
                                type="email"
                                className="solana-input-field"
                                placeholder="name@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <button type="submit" disabled={loading} className="solana-btn-primary" style={{ marginTop: '0.5rem' }}>
                        {loading ? (
                            <span>Signing In...</span>
                        ) : (
                            <>
                                <LogIn size={18} />
                                <span>Sign In with Email OTP</span>
                            </>
                        )}
                    </button>
                </form>

                <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                    <button
                        type="button"
                        onClick={() => setShowRecovery(true)}
                        className="solana-btn-outline"
                    >
                        <Key size={16} />
                        <span>Account Recovery</span>
                    </button>
                    <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)', textAlign: 'center', marginTop: '0.75rem', lineHeight: 1.4, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}>
                        <Info size={14} />
                        <span>If registered, enter your 12-word seed phrase to receive a login link.</span>
                    </p>
                </div>

                <div style={{ textAlign: 'center', marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.08)', fontSize: '0.85rem', color: '#94a3b8' }}>
                    Don't have an account yet?{' '}
                    <Link href="/signup" className="solana-link">
                        Sign Up
                    </Link>
                </div>
            </div>

            <RecoveryModal isOpen={showRecovery} onClose={() => setShowRecovery(false)} />
        </div>
    );
};