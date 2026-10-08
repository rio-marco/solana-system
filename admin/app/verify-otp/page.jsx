'use client';

import React, { useState, useEffect, Suspense } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { ShieldCheck, Check, AlertCircle, Copy, Key, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { copyTextToClipboard } from '../../lib/clipboard';

function VerifyOtpContent() {
    const searchParams = useSearchParams();
    const initialEmail = searchParams.get('email') || '';
    const initialRequires2FA = searchParams.get('requires2FA') === 'true';

    const [email, setEmail] = useState(initialEmail);
    const [otp, setOtp] = useState('');
    const [twoFACode, setTwoFACode] = useState('');
    const [requires2FA, setRequires2FA] = useState(initialRequires2FA);
    const [tempUserId, setTempUserId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [recoveryPhrase, setRecoveryPhrase] = useState(null);
    const [copiedPhrase, setCopiedPhrase] = useState(false);
    const [confirmedCheck, setConfirmedCheck] = useState(false);
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
                if (res.data.data && res.data.data.requires2FA) {
                    setRequires2FA(true);
                    setTempUserId(res.data.data.tempUserId || null);
                    toastSuccess('Email verified. Please enter your 2FA code.');
                } else if (res.data.data && res.data.data.recoveryPhrase) {
                    setRecoveryPhrase(res.data.data.recoveryPhrase);
                    toastSuccess(res.data.msg || 'OTP Verified successfully!');
                } else {
                    toastSuccess(res.data.msg || 'OTP Verified successfully!');
                    await checkAuth();
                    router.push('/');
                };
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

    const handleVerify2FA = async (e) => {
        e.preventDefault();
        setError(null);

        if (twoFACode.length !== 6) {
            const msg = 'Please enter the complete 6-digit 2FA code.';
            setError(msg);
            toastError(msg);
            return;
        };

        try {
            setLoading(true);
            const res = await axios.post('/api/auth/verify-2fa-code', {
                email,
                code: twoFACode,
                tempUserId,
            });

            if (res.data && res.data.flag) {
                toastSuccess(res.data.msg || '2FA Verification successful!');
                await checkAuth();
                router.push('/');
            } else {
                const msg = res.data?.msg || res.data?.message || 'Invalid 2FA code.';
                setError(msg);
                toastError(msg);
            };
        } catch (err) {
            const msg = err.response?.data?.msg || err.response?.data?.message || 'Invalid 2FA authentication code.';
            setError(msg);
            toastError(msg);
        } finally {
            setLoading(false);
        };
    };

    const handleContinueToDashboard = async () => {
        await checkAuth();
        router.push('/');
    };

    const copyPhrase = async () => {
        if (recoveryPhrase) {
            const ok = await copyTextToClipboard(recoveryPhrase);
            if (ok) {
                setCopiedPhrase(true);
                setTimeout(() => setCopiedPhrase(false), 2000);
            };
        };
    };

    const words = recoveryPhrase ? recoveryPhrase.split(' ') : [];

    return (
        <div className="solana-auth-card">
            {requires2FA ? (
                /* 2FA Authenticator Code Form */
                <>
                    <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
                        <div className="solana-brand-pill" style={{ marginBottom: '0.75rem', borderColor: 'rgba(153,69,255,0.4)', color: '#9945FF' }}>
                            <Shield size={15} />
                            <span>Two-Factor Authentication</span>
                        </div>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.35rem' }}>
                            Enter 2FA Code
                        </h2>
                        <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                            Open your Authenticator app (Google Authenticator/Authy) and enter the 6-digit code for:<br />
                            <strong className="font-mono" style={{ color: '#00C2FF' }}>{email}</strong>
                        </p>
                    </div>

                    {error && (
                        <div className="solana-alert-danger">
                            <AlertCircle size={18} />
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleVerify2FA}>
                        <div className="form-group-custom">
                            <label className="solana-input-label" style={{ textAlign: 'center' }}>6-Digit 2FA Code</label>
                            <input
                                type="text"
                                className="solana-input-field otp-input-field"
                                placeholder="000000"
                                maxLength={6}
                                value={twoFACode}
                                onChange={(e) => setTwoFACode(e.target.value.replace(/\D/g, ''))}
                                autoFocus
                                required
                            />
                        </div>

                        <button type="submit" disabled={loading} className="solana-btn-primary" style={{ marginTop: '0.75rem' }}>
                            {loading ? (
                                <span>Verifying 2FA Code...</span>
                            ) : (
                                <>
                                    <Check size={18} />
                                    <span>Verify 2FA & Sign In</span>
                                </>
                            )}
                        </button>
                    </form>

                    <div style={{ textAlign: 'center', marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid rgba(255,255,255,0.08)', fontSize: '0.85rem', color: '#94a3b8' }}>
                        Having trouble?{' '}
                        <Link href="/login" className="solana-link">
                            Back to Login
                        </Link>
                    </div>
                </>
            ) : !recoveryPhrase ? (
                /* Email OTP Code Form */
                <>
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
                </>
            ) : (
                /* Mnemonic phrase display */
                <div>
                    <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                        <div className="solana-brand-pill" style={{ color: '#F59E0B', borderColor: 'rgba(245,158,11,0.3)', background: 'rgba(245,158,11,0.1)' }}>
                            <Key size={15} />
                            <span>Secret Recovery Phrase</span>
                        </div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ffffff', marginTop: '0.5rem' }}>
                            Save Your 12 Words
                        </h3>
                        <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.25rem', lineHeight: 1.4 }}>
                            Important: Write down these 12 words and store them safely. This is the ONLY way to recover your account if you lose email access.
                        </p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '1.25rem' }}>
                        {words.map((w, i) => (
                            <div key={i} className="font-mono" style={{ background: '#07090e', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 10px', borderRadius: '10px', fontSize: '0.8rem', color: '#14F195', textAlign: 'center' }}>
                                <span style={{ color: '#64748b', fontSize: '0.7rem', marginRight: '4px' }}>{i + 1}.</span>{w}
                            </div>
                        ))}
                    </div>

                    <button onClick={copyPhrase} className="solana-btn-outline" style={{ marginBottom: '1rem' }}>
                        <Copy size={16} />
                        <span>{copiedPhrase ? 'Copied All 12 Words!' : 'Copy All 12 Words'}</span>
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.25rem' }}>
                        <input
                            type="checkbox"
                            id="phraseConfirm"
                            checked={confirmedCheck}
                            onChange={(e) => setConfirmedCheck(e.target.checked)}
                            style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#14F195' }}
                        />
                        <label htmlFor="phraseConfirm" style={{ fontSize: '0.78rem', color: '#94a3b8', cursor: 'pointer' }}>
                            I have written down / copied my 12-word recovery phrase and stored it safely.
                        </label>
                    </div>

                    <button
                        onClick={handleContinueToDashboard}
                        disabled={!confirmedCheck}
                        className="solana-btn-primary"
                    >
                        <Check size={18} />
                        <span>Go to Dashboard</span>
                    </button>
                </div>
            )}
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