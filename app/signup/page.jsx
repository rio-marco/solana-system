'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, Mail, UserPlus, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function SignupPage() {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!authLoading && user) {
            router.push('/');
        };
    }, [user, authLoading, router]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if (!fullName.trim() || !email.trim()) {
            setError('Full name and email address are required.');
            return;
        };

        try {
            setLoading(true);
            const res = await axios.post('/api/auth/signup', {
                fullName: fullName.trim(),
                email: email.trim(),
            });

            if (res.data && res.data.flag) {
                router.push(`/verify-otp?email=${encodeURIComponent(email.trim())}`);
            } else {
                setError(res.data.message || 'Registration failed.');
            };
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create account.');
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
                        <UserPlus size={15} />
                        <span>Create Account</span>
                    </div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.35rem' }}>
                        Sign Up
                    </h2>
                    <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                        Register to get a Solana Wallet and manage SOL
                    </p>
                </div>

                {error && (
                    <div className="solana-alert-danger">
                        <AlertCircle size={18} />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="form-group-custom">
                        <label className="solana-input-label">Full Name</label>
                        <div className="solana-input-icon-wrapper">
                            <User className="input-svg-icon" />
                            <input
                                type="text"
                                className="solana-input-field"
                                placeholder="John Doe"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                required
                            />
                        </div>
                    </div>

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
                            <span>Creating Account...</span>
                        ) : (
                            <>
                                <UserPlus size={18} />
                                <span>Create Account & Send Code</span>
                            </>
                        )}
                    </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid rgba(255,255,255,0.08)', fontSize: '0.85rem', color: '#94a3b8' }}>
                    Already registered?{' '}
                    <Link href="/login" className="solana-link">
                        Sign In
                    </Link>
                </div>
            </div>
        </div>
    );
};