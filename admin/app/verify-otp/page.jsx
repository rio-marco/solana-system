'use client';

import React, { useState, useEffect, Suspense } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { ShieldCheck, Check, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

function VerifyOtpContent() {
    const searchParams = useSearchParams();
    const initialEmail = searchParams.get('email') || '';

    const [email, setEmail] = useState(initialEmail);
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { checkAuth } = useAuth();
    const { toastError, toastSuccess } = useToast();
    const router = useRouter();

    useEffect(() => {
        if (!email) {
            router.push('/login');
        };
    }, [email, router]);

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setError(null);

        if (otp.length !== 6) {
            const msg = 'Please enter the complete 6-digit OTP code.';
            setError(msg);
            toastError(msg);
            return;
        };

        try {
            setLoading(true);
            const res = await axios.post('/api/auth/verify-otp', { email, otp });
            if (res.data && res.data.flag) {
                toastSuccess(res.data.msg || 'OTP Verified successfully!');
                await checkAuth();
                router.push('/');
            } else {
                const msg = res.data?.msg || res.data?.message || 'OTP verification failed.';
                setError(msg);
                toastError(msg);
            };
        } catch (err) {
            const msg = err.response?.data?.msg || err.response?.data?.message || 'Invalid or expired OTP code.';
            setError(msg);
            toastError(msg);
        } finally {
            setLoading(false);
        };
    };

    return (
        <div className="solana-auth-card">
            <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
                <div className="solana-brand-pill" style={{ marginBottom: '0.75rem' }}>
                    <ShieldCheck size={15} />
                    <span>Email Verification</span>
                </div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.35rem' }}>
                    Verification Code
                </h2>
                <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                    We sent a 6-digit OTP code to:<br />
                    <strong className="font-mono" style={{ color: '#00C2FF' }}>{email}</strong>
                </p>
            </div>

            {error && (
                <div className="solana-alert-danger">
                    <AlertCircle size={18} />
                    <span>{error}</span>
                </div>
            )}

            <form onSubmit={handleVerifyOtp}>
                <div className="form-group-custom">
                    <label className="solana-input-label" style={{ textAlign: 'center' }}>6-Digit OTP Code</label>
                    <input
                        type="text"
                        className="solana-input-field otp-input-field"
                        placeholder="000000"
                        maxLength={6}
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                        autoFocus
                        required
                    />
                </div>

                <button type="submit" disabled={loading} className="solana-btn-primary" style={{ marginTop: '0.75rem' }}>
                    {loading ? (
                        <span>Verifying Code...</span>
                    ) : (
                        <>
                            <Check size={18} />
                            <span>Verify OTP & Login</span>
                        </>
                    )}
                </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid rgba(255,255,255,0.08)', fontSize: '0.85rem', color: '#94a3b8' }}>
                Need to sign in with email?{' '}
                <Link href="/login" className="solana-link">
                    Go to Login
                </Link>
            </div>
        </div>
    );
};

export default function VerifyOtpPage() {
    return (
        <div className="auth-page-wrapper">
            <Suspense fallback={
                <div className="solana-auth-card text-center text-purple-400 font-mono text-sm py-8">
                    Loading verification page...
                </div>
            }>
                <VerifyOtpContent />
            </Suspense>
        </div>
    );
};