'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { Shield, Mail, Lock, Eye, EyeOff, LogIn, AlertCircle, Info, KeyRound } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export default function AdminLoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const { admin, login, loading: authLoading } = useAuth();
    const { toastError, toastSuccess } = useToast();
    const router = useRouter();

    useEffect(() => {
        if (!authLoading && admin) {
            router.push('/');
        };
    }, [admin, authLoading, router]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if (!email || !email.trim()) {
            const msg = 'Please enter your email address.';
            setError(msg);
            toastError(msg);
            return;
        };

        if (!password || !password.trim()) {
            const msg = 'Please enter your password.';
            setError(msg);
            toastError(msg);
            return;
        };

        try {
            setLoading(true);
            const res = await axios.post('/api/auth/login', {
                email: email.trim(),
                password: password.trim(),
            });

            if (res.data && res.data.flag) {
                toastSuccess(res.data.msg || 'Admin login successfully!');
                if (res.data.data?.admin) {
                    login(res.data.data.admin);
                };

                router.push('/');
            } else {
                const msg = res.data?.msg || res.data?.message || 'Invalid email address or password.';
                setError(msg);
                toastError(msg);
            };
        } catch (err) {
            const msg = err.response?.data?.msg || err.response?.data?.message || 'Invalid email address or password.';
            setError(msg);
            toastError(msg);
        } finally {
            setLoading(false);
        };
    };

    const handleFillDefaultAdmin = () => {
        setEmail('admin@solana.com');
        setPassword('admin123');
        setError(null);
    };

    if (authLoading) {
        return (
            <div className="min-h-screen bg-dark flex flex-col items-center justify-center text-purple-400 gap-3 font-mono text-sm">
                <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
                <span>Loading Admin Portal...</span>
            </div>
        );
    };

    return (
        <div className="auth-page-wrapper">
            <div className="solana-auth-card" style={{ border: '1px solid rgba(239, 68, 68, 0.3)', boxShadow: '0 25px 60px rgba(0, 0, 0, 0.6)' }}>
                {/* Header Branding */}
                <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
                    <div
                        className="solana-brand-pill"
                        style={{
                            marginBottom: '0.75rem',
                            background: 'rgba(239, 68, 68, 0.15)',
                            color: '#fca5a5',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                        }}
                    >
                        <Shield size={16} style={{ color: '#ef4444' }} />
                        <span>SOLANA SYSTEM - ADMIN PANEL</span>
                    </div>
                    <h2 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#ffffff', marginBottom: '0.35rem' }}>
                        Admin Portal Login
                    </h2>
                    <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                        Enter your admin credentials to access system management
                    </p>
                </div>

                {error && (
                    <div className="solana-alert-danger" style={{ marginBottom: '1.25rem' }}>
                        <AlertCircle size={18} style={{ flexShrink: 0 }} />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    {/* Admin Email Field */}
                    <div className="form-group-custom">
                        <label className="solana-input-label">Email Address</label>
                        <div className="solana-input-icon-wrapper">
                            <Mail className="input-svg-icon" style={{ color: '#ef4444' }} />
                            <input
                                type="email"
                                className="solana-input-field"
                                placeholder="Enter your email here"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    {/* Admin Password Field */}
                    <div className="form-group-custom">
                        <label className="solana-input-label">Password</label>
                        <div className="solana-input-icon-wrapper" style={{ position: 'relative' }}>
                            <Lock className="input-svg-icon" style={{ color: '#ef4444' }} />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                className="solana-input-field"
                                placeholder="Enter Your password here"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                style={{ paddingRight: '2.75rem' }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{
                                    position: 'absolute',
                                    right: '1rem',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'none',
                                    border: 'none',
                                    color: '#94a3b8',
                                    cursor: 'pointer',
                                    padding: '0.2rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                                title={showPassword ? 'Hide password' : 'Show password'}
                            >
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    {/* Sign In Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="solana-btn-primary"
                        style={{
                            marginTop: '0.75rem',
                            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                            boxShadow: '0 8px 24px rgba(239, 68, 68, 0.35)',
                        }}
                    >
                        {loading ? (
                            <span>Authenticating Admin...</span>
                        ) : (
                            <>
                                <LogIn size={18} />
                                <span>Sign In to Admin Panel</span>
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};