'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { User as UserIcon, Camera, Save, AlertCircle, CheckCircle, X, Shield, ShieldCheck, ShieldOff, Copy, Check } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { copyTextToClipboard } from '../lib/clipboard';

export const ProfileModal = ({ isOpen, onClose }) => {
    const { user, updateUserData } = useAuth();
    const { toastError, toastSuccess } = useToast();
    const [fullName, setFullName] = useState(user?.fullName || '');
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(user?.profilePhoto ? (user.profilePhoto.startsWith('/') ? user.profilePhoto : `/${user.profilePhoto}`) : null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // 2FA state
    const [show2FASetup, setShow2FASetup] = useState(false);
    const [show2FADisable, setShow2FADisable] = useState(false);
    const [twoFASecretData, setTwoFASecretData] = useState(null);
    const [twoFACode, setTwoFACode] = useState('');
    const [twoFALoading, setTwoFALoading] = useState(false);
    const [copiedSecret, setCopiedSecret] = useState(false);

    useEffect(() => {
        if (user) {
            setFullName(user.fullName || '');
            setPreview(user.profilePhoto ? (user.profilePhoto.startsWith('/') ? user.profilePhoto : `/${user.profilePhoto}`) : null);
        };
    }, [user]);

    if (!isOpen || !user) return null;

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            setPreview(URL.createObjectURL(selectedFile));
        };
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        if (!fullName.trim()) {
            const msg = 'Full name is required.';
            setError(msg);
            toastError(msg);
            return;
        };

        try {
            setLoading(true);
            const formData = new FormData();
            formData.append('fullName', fullName.trim());
            if (file) {
                formData.append('profilePhoto', file);
            };

            const res = await axios.post('/api/user/profile/update', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            if (res.data && res.data.flag && res.data.data) {
                updateUserData(res.data.data.user);
                const succMsg = res.data.msg || 'Profile updated successfully.';
                setSuccess(succMsg);
                toastSuccess(succMsg);
                setTimeout(() => {
                    onClose();
                }, 1200);
            } else {
                const errMsg = res.data?.msg || res.data?.message || 'Failed to update profile.';
                setError(errMsg);
                toastError(errMsg);
            };
        } catch (err) {
            const errMsg = err.response?.data?.msg || err.response?.data?.message || 'Error updating profile.';
            setError(errMsg);
            toastError(errMsg);
        } finally {
            setLoading(false);
        };
    };

    const handleStart2FASetup = async () => {
        try {
            setTwoFALoading(true);
            setError(null);
            const res = await axios.post('/api/user/2fa/generate');
            if (res.data && res.data.flag && res.data.data) {
                setTwoFASecretData(res.data.data);
                setShow2FASetup(true);
                setShow2FADisable(false);
                setTwoFACode('');
            } else {
                toastError(res.data?.msg || 'Failed to generate 2FA secret.');
            };
        } catch (err) {
            toastError(err.response?.data?.msg || 'Failed to start 2FA setup.');
        } finally {
            setTwoFALoading(false);
        };
    };

    const handleConfirmEnable2FA = async (e) => {
        e.preventDefault();
        if (!twoFACode || twoFACode.length !== 6) {
            toastError('Please enter a valid 6-digit code from your Authenticator app.');
            return;
        };

        try {
            setTwoFALoading(true);
            const res = await axios.post('/api/user/2fa/enable', {
                secret: twoFASecretData?.secret,
                code: twoFACode,
            });

            if (res.data && res.data.flag) {
                updateUserData(res.data.data.user);
                toastSuccess(res.data.msg || '2FA Enabled successfully!');
                setShow2FASetup(false);
                setTwoFASecretData(null);
                setTwoFACode('');
            } else {
                toastError(res.data?.msg || 'Invalid 2FA authentication code.');
            };
        } catch (err) {
            toastError(err.response?.data?.msg || 'Failed to enable 2FA.');
        } finally {
            setTwoFALoading(false);
        };
    };

    const handleConfirmDisable2FA = async (e) => {
        e.preventDefault();
        if (!twoFACode || twoFACode.length !== 6) {
            toastError('Please enter a valid 6-digit code to disable 2FA.');
            return;
        };

        try {
            setTwoFALoading(true);
            const res = await axios.post('/api/user/2fa/disable', {
                code: twoFACode,
            });

            if (res.data && res.data.flag) {
                updateUserData(res.data.data.user);
                toastSuccess(res.data.msg || '2FA Disabled successfully!');
                setShow2FADisable(false);
                setTwoFACode('');
            } else {
                toastError(res.data?.msg || 'Invalid 2FA authentication code.');
            };
        } catch (err) {
            toastError(err.response?.data?.msg || 'Failed to disable 2FA.');
        } finally {
            setTwoFALoading(false);
        };
    };

    const copySecretKey = async () => {
        if (twoFASecretData?.secret) {
            const ok = await copyTextToClipboard(twoFASecretData.secret);
            if (ok) {
                setCopiedSecret(true);
                setTimeout(() => setCopiedSecret(false), 2000);
            };
        };
    };

    return (
        <div className="solana-modal-overlay">
            <div className="solana-modal-card" style={{ maxWidth: '520px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <UserIcon style={{ color: '#9945FF' }} size={20} />
                        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff' }}>User Profile & Security</h3>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                        <X size={20} />
                    </button>
                </div>

                {error && (
                    <div className="solana-alert-danger">
                        <AlertCircle size={18} />
                        <span>{error}</span>
                    </div>
                )}

                {success && (
                    <div className="solana-alert-success">
                        <CheckCircle size={18} />
                        <span>{success}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1.25rem' }}>
                        <div style={{ position: 'relative' }}>
                            {preview ? (
                                <img
                                    src={preview}
                                    alt="Avatar Preview"
                                    style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #9945FF' }}
                                />
                            ) : (
                                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(153,69,255,0.2)', border: '2px solid #9945FF', color: '#14F195', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem', fontWeight: 800 }}>
                                    {fullName ? fullName[0].toUpperCase() : 'U'}
                                </div>
                            )}
                            <label
                                htmlFor="profilePhotoInput"
                                style={{ position: 'absolute', bottom: 0, right: 0, width: '28px', height: '28px', borderRadius: '50%', background: '#9945FF', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                            >
                                <Camera size={14} />
                            </label>
                            <input
                                id="profilePhotoInput"
                                type="file"
                                accept="image/*"
                                style={{ display: 'none' }}
                                onChange={handleFileChange}
                            />
                        </div>
                    </div>

                    <div className="form-group-custom">
                        <label className="solana-input-label">Email Address</label>
                        <input
                            type="email"
                            className="solana-input-field"
                            value={user.email}
                            disabled
                            style={{ opacity: 0.6, cursor: 'not-allowed', paddingLeft: '1rem' }}
                        />
                    </div>

                    <div className="form-group-custom">
                        <label className="solana-input-label">Full Name</label>
                        <input
                            type="text"
                            className="solana-input-field"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            style={{ paddingLeft: '1rem' }}
                            required
                        />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginBottom: '1.5rem' }}>
                        <button type="submit" disabled={loading} className="solana-btn-primary" style={{ width: 'auto', padding: '0 1.25rem', height: '38px', fontSize: '0.85rem' }}>
                            {loading ? (
                                <span>Saving...</span>
                            ) : (
                                <>
                                    <Save size={15} />
                                    <span>Save Profile</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>

                {/* 2FA Security Section */}
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Shield size={18} style={{ color: user.is2FAEnabled ? '#14F195' : '#94a3b8' }} />
                            <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#fff' }}>Two-Factor Authentication (2FA)</span>
                        </div>
                        {user.is2FAEnabled ? (
                            <span style={{ color: '#14F195', background: 'rgba(20,241,149,0.12)', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.75rem', border: '1px solid rgba(20,241,149,0.3)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                                <ShieldCheck size={13} /> Enabled
                            </span>
                        ) : (
                            <span style={{ color: '#ef4444', background: 'rgba(239,68,68,0.12)', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.75rem', border: '1px solid rgba(239,68,68,0.3)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                                <ShieldOff size={13} /> Disabled
                            </span>
                        )}
                    </div>

                    <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '1rem', lineHeight: 1.4 }}>
                        Secure your account with 2FA. When enabled, signing in via OTP or direct email link will require an authenticator code.
                    </p>

                    {!user.is2FAEnabled && !show2FASetup && (
                        <button
                            type="button"
                            onClick={handleStart2FASetup}
                            disabled={twoFALoading}
                            className="solana-btn-outline"
                            style={{ width: '100%', borderColor: 'rgba(153,69,255,0.4)', color: '#9945FF' }}
                        >
                            <ShieldCheck size={16} />
                            <span>{twoFALoading ? 'Generating Setup...' : 'Setup / Enable 2FA'}</span>
                        </button>
                    )}

                    {user.is2FAEnabled && !show2FADisable && (
                        <button
                            type="button"
                            onClick={() => { setShow2FADisable(true); setShow2FASetup(false); setTwoFACode(''); }}
                            className="solana-btn-outline"
                            style={{ width: '100%', borderColor: 'rgba(239,68,68,0.4)', color: '#fca5a5' }}
                        >
                            <ShieldOff size={16} />
                            <span>Disable 2FA</span>
                        </button>
                    )}

                    {/* Enable 2FA Panel */}
                    {show2FASetup && twoFASecretData && (
                        <div style={{ background: '#07090e', border: '1px solid rgba(153,69,255,0.3)', borderRadius: '12px', padding: '1rem', marginTop: '0.75rem' }}>
                            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#14F195', marginBottom: '0.5rem', textAlign: 'center' }}>
                                Scan QR Code with Authenticator App
                            </h4>
                            <p style={{ fontSize: '0.75rem', color: '#94a3b8', textAlign: 'center', marginBottom: '0.75rem' }}>
                                Use Google Authenticator or Authy to scan this QR code.
                            </p>

                            <div style={{ display: 'flex', justifyContent: 'center', background: '#ffffff', padding: '12px', borderRadius: '8px', width: 'fit-content', margin: '0 auto 0.75rem auto' }}>
                                <QRCodeSVG value={twoFASecretData.uri || twoFASecretData.secret} size={150} />
                            </div>

                            <div style={{ marginBottom: '0.85rem' }}>
                                <label className="solana-input-label" style={{ fontSize: '0.75rem' }}>Secret Key (Manual Entry)</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <input
                                        type="text"
                                        readOnly
                                        className="solana-input-field font-mono"
                                        value={twoFASecretData.secret}
                                        style={{ fontSize: '0.8rem', paddingLeft: '0.75rem' }}
                                    />
                                    <button
                                        type="button"
                                        onClick={copySecretKey}
                                        className="solana-btn-outline"
                                        style={{ width: 'auto', padding: '0 0.75rem', height: '38px' }}
                                    >
                                        {copiedSecret ? <Check size={16} style={{ color: '#14F195' }} /> : <Copy size={16} />}
                                    </button>
                                </div>
                            </div>

                            <form onSubmit={handleConfirmEnable2FA}>
                                <div className="form-group-custom" style={{ marginBottom: '0.85rem' }}>
                                    <label className="solana-input-label" style={{ fontSize: '0.75rem' }}>Enter 6-Digit Authenticator Code</label>
                                    <input
                                        type="text"
                                        maxLength={6}
                                        className="solana-input-field otp-input-field"
                                        placeholder="000000"
                                        value={twoFACode}
                                        onChange={(e) => setTwoFACode(e.target.value.replace(/\D/g, ''))}
                                        required
                                        autoFocus
                                    />
                                </div>

                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button
                                        type="button"
                                        onClick={() => { setShow2FASetup(false); setTwoFASecretData(null); }}
                                        className="solana-btn-outline"
                                        style={{ flex: 1 }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={twoFALoading}
                                        className="solana-btn-primary"
                                        style={{ flex: 1 }}
                                    >
                                        {twoFALoading ? 'Enabling...' : 'Verify & Enable'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Disable 2FA Panel */}
                    {show2FADisable && (
                        <div style={{ background: '#07090e', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '12px', padding: '1rem', marginTop: '0.75rem' }}>
                            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fca5a5', marginBottom: '0.5rem', textAlign: 'center' }}>
                                Confirm Disable 2FA
                            </h4>
                            <p style={{ fontSize: '0.75rem', color: '#94a3b8', textAlign: 'center', marginBottom: '0.75rem' }}>
                                Enter the 6-digit code from your Authenticator app to confirm disabling 2FA.
                            </p>

                            <form onSubmit={handleConfirmDisable2FA}>
                                <div className="form-group-custom" style={{ marginBottom: '0.85rem' }}>
                                    <label className="solana-input-label" style={{ fontSize: '0.75rem' }}>6-Digit 2FA Code</label>
                                    <input
                                        type="text"
                                        maxLength={6}
                                        className="solana-input-field otp-input-field"
                                        placeholder="000000"
                                        value={twoFACode}
                                        onChange={(e) => setTwoFACode(e.target.value.replace(/\D/g, ''))}
                                        required
                                        autoFocus
                                    />
                                </div>

                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button
                                        type="button"
                                        onClick={() => setShow2FADisable(false)}
                                        className="solana-btn-outline"
                                        style={{ flex: 1 }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={twoFALoading}
                                        className="solana-btn-primary"
                                        style={{ flex: 1, background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' }}
                                    >
                                        {twoFALoading ? 'Disabling...' : 'Confirm Disable'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};