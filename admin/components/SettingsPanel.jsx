'use client';

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
    Settings,
    KeyRound,
    Lock,
    RefreshCw,
    CheckCircle2,
    AlertCircle,
    Eye,
    EyeOff,
    Save,
    Wallet,
    Zap,
    ExternalLink,
} from 'lucide-react';
import { CopyButton } from '../lib/clipboard';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

function SectionCard({ title, subtitle, icon: Icon, accentColor = '#9945FF', children }) {
    return (
        <div style={{ background: 'rgba(15,20,34,0.75)', backdropFilter: 'blur(12px)', borderRadius: '24px', border: `1px solid rgba(255,255,255,0.08)`, padding: '1.75rem', boxShadow: '0 20px 50px rgba(0,0,0,0.3)', marginBottom: '1.5rem', borderTop: `3px solid ${accentColor}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: `rgba(${accentColor === '#14F195' ? '20,241,149' : accentColor === '#ef4444' ? '239,68,68' : '153,69,255'},0.15)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={20} style={{ color: accentColor }} />
                </div>
                <div>
                    <h3 style={{ color: '#fff', fontWeight: 800, fontSize: '1rem', margin: 0 }}>{title}</h3>
                    <p style={{ color: '#64748b', fontSize: '0.78rem', margin: 0 }}>{subtitle}</p>
                </div>
            </div>
            {children}
        </div>
    );
};

function InputField({ label, type = 'text', value, onChange, placeholder, disabled = false, rightAddon }) {
    return (
        <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.45rem' }}>{label}</label>
            <div style={{ position: 'relative' }}>
                <input
                    type={type}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    disabled={disabled}
                    style={{ width: '100%', background: 'rgba(7,9,14,0.8)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '12px', padding: rightAddon ? '0.7rem 3rem 0.7rem 1rem' : '0.7rem 1rem', color: '#fff', fontSize: '0.88rem', outline: 'none', transition: 'border-color 0.2s', opacity: disabled ? 0.6 : 1 }}
                />
                {rightAddon && (
                    <div style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)' }}>
                        {rightAddon}
                    </div>
                )}
            </div>
        </div>
    );
};

function Alert({ type, message }) {
    const isSuccess = type === 'success';
    return (
        <div style={{ background: isSuccess ? 'rgba(20,241,149,0.1)' : 'rgba(239,68,68,0.1)', border: `1px solid ${isSuccess ? 'rgba(20,241,149,0.3)' : 'rgba(239,68,68,0.3)'}`, borderRadius: '12px', padding: '0.8rem 1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.6rem', color: isSuccess ? '#14F195' : '#fca5a5', fontSize: '0.85rem', fontWeight: 600 }}>
            {isSuccess ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            {message}
        </div>
    );
};

export function SettingsPanel() {
    const { toastError, toastSuccess } = useToast();
    const { setAdmin } = useAuth();

    // Password change state
    const [pwCurrent, setPwCurrent] = useState('');
    const [pwNew, setPwNew] = useState('');
    const [pwConfirm, setPwConfirm] = useState('');
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [pwLoading, setPwLoading] = useState(false);

    // Generate wallet state
    const [genLoading, setGenLoading] = useState(false);
    const [generatedWallet, setGeneratedWallet] = useState(null);

    // Platform settings state
    const [settings, setSettings] = useState({
        SOLANA_SENDER_PRIVATE_KEY: '',
        SOLANA_SENDER_PUBLIC_KEY: '',
        SOLANA_PLATFORM_PUBLIC_KEY: '',
        WITHDRAWAL_PLATFORM_FEE: '',
        SOLANA_NETWORK: '',
    });
    const [settingsLoading, setSettingsLoading] = useState(false);
    const [fetchingSettings, setFetchingSettings] = useState(true);
    const [settingsMsg, setSettingsMsg] = useState(null);
    const [showPrivKey, setShowPrivKey] = useState(false);

    const fetchPlatformSettings = useCallback(async () => {
        setFetchingSettings(true);
        try {
            const res = await axios.get('/api/admin/settings/platform');
            if (res.data?.flag && res.data?.data?.settings) {
                setSettings(res.data.data.settings);
            };
        } catch (err) {
            console.error('Failed to fetch platform settings:', err);
        } finally {
            setFetchingSettings(false);
        };
    }, []);

    useEffect(() => {
        fetchPlatformSettings();
    }, [fetchPlatformSettings]);

    const handlePasswordChange = async (e) => {
        e.preventDefault();

        if (!pwCurrent || !pwNew || !pwConfirm) {
            toastError('All fields are required.');
            return;
        };

        if (pwNew.length < 6) {
            toastError('New password must be at least 6 characters.');
            return;
        };

        if (pwCurrent === pwNew) {
            toastError('New password cannot be the same as current password.');
            return;
        };

        if (pwNew !== pwConfirm) {
            toastError('New password and confirm password do not match.');
            return;
        };

        setPwLoading(true);

        try {
            const payload = {
                currentPassword: pwCurrent,
                newPassword: pwNew,
                confirmPassword: pwConfirm,
            };

            const res = await axios.patch('/api/admin/settings/password', payload);
            if (res.data?.flag) {
                setPwCurrent('');
                setPwNew('');
                setPwConfirm('');
                toastSuccess(res.data?.msg || res.data?.message || 'Password updated successfully!');
            } else {
                toastError(res.data?.msg || res.data?.message || 'Failed to update password.');
            };
        } catch (err) {
            const errMsg = err.response?.data?.msg || err.response?.data?.message || 'Error updating password.';
            toastError(errMsg);
        } finally {
            setPwLoading(false);
            setTimeout(() => setAdmin(null), 1500);
        };
    };

    const handleGenerateWallet = async () => {
        setGeneratedWallet(null);
        setGenLoading(true);
        try {
            const res = await axios.post('/api/admin/wallet/generate');
            if (res.data?.flag && res.data?.data) {
                setGeneratedWallet(res.data.data);
                toastSuccess(res.data?.msg || res.data?.message || 'New wallet address generated successfully!');
                fetchPlatformSettings();
            } else {
                toastError(res.data?.msg || res.data?.message || 'Failed to generate wallet.');
            };
        } catch (err) {
            const errMsg = err.response?.data?.msg || err.response?.data?.message || 'Error generating wallet.';
            toastError(errMsg);
        } finally {
            setGenLoading(false);
        };
    };

    const handleSettingsSave = async (e) => {
        e.preventDefault();
        setSettingsMsg(null);
        setSettingsLoading(true);
        try {
            const res = await axios.patch('/api/admin/settings/platform', { settings });
            if (res.data?.flag) {
                toastSuccess(res.data?.msg || res.data?.message || 'Platform settings saved successfully!');
            } else {
                toastError(res.data?.msg || res.data?.message || 'Failed to save settings.');
            };
        } catch (err) {
            const errMsg = err.response?.data?.msg || err.response?.data?.message || 'Error saving settings.';
            toastError(errMsg);
        } finally {
            setSettingsLoading(false);
        };
    };

    const inputStyle = {
        width: '100%',
        background: 'rgba(7,9,14,0.8)',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: '12px',
        padding: '0.7rem 1rem',
        color: '#fff',
        fontSize: '0.88rem',
        outline: 'none',
    };

    const explorerUrl = settings.SOLANA_PLATFORM_PUBLIC_KEY
        ? `https://explorer.solana.com/address/${settings.SOLANA_PLATFORM_PUBLIC_KEY}?cluster=${settings.SOLANA_NETWORK || 'devnet'}`
        : '#';

    return (
        <div>
            {/* Header */}
            <div style={{ marginBottom: '1.75rem', padding: '1.75rem 1.5rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.07)', }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#94a3b8', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem' }}>
                    <Settings size={16} /> Settings
                </div>
                <h1 style={{ color: '#fff', fontSize: '1.6rem', fontWeight: 900, margin: 0 }}>Admin Settings</h1>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1.5rem', alignItems: 'start' }}>
                {/* Left Column */}
                <div>
                    {/* Change Password */}
                    <SectionCard title="Change Password" subtitle="Update your admin account password" icon={Lock} accentColor="#ef4444">
                        <form onSubmit={handlePasswordChange}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.45rem' }}>Current Password</label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type={showCurrent ? 'text' : 'password'}
                                        value={pwCurrent}
                                        onChange={e => setPwCurrent(e.target.value)}
                                        placeholder="Enter current password"
                                        style={{ ...inputStyle, paddingRight: '3rem' }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowCurrent(v => !v)}
                                        style={{
                                            position: 'absolute',
                                            right: '0.75rem',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            background: 'none',
                                            border: 'none',
                                            color: '#64748b',
                                            cursor: 'pointer',
                                            padding: 0,
                                        }}
                                    >
                                        {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label
                                    style={{
                                        display: 'block',
                                        color: '#94a3b8',
                                        fontSize: '0.8rem',
                                        fontWeight: 600,
                                        marginBottom: '0.45rem',
                                    }}
                                >
                                    New Password
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type={showNew ? 'text' : 'password'}
                                        value={pwNew}
                                        onChange={e => setPwNew(e.target.value)}
                                        placeholder="Min 6 characters"
                                        style={{ ...inputStyle, paddingRight: '3rem' }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowNew(v => !v)}
                                        style={{
                                            position: 'absolute',
                                            right: '0.75rem',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            background: 'none',
                                            border: 'none',
                                            color: '#64748b',
                                            cursor: 'pointer',
                                            padding: 0,
                                        }}
                                    >
                                        {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.45rem' }}>
                                    Confirm New Password
                                </label>
                                <input
                                    type="password"
                                    value={pwConfirm}
                                    onChange={e => setPwConfirm(e.target.value)}
                                    placeholder="Re-enter new password"
                                    style={inputStyle}
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={pwLoading}
                                style={{
                                    width: '100%',
                                    padding: '0.85rem',
                                    borderRadius: '14px',
                                    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                                    border: 'none',
                                    color: '#fff',
                                    fontWeight: 700,
                                    fontSize: '0.9rem',
                                    cursor: pwLoading ? 'not-allowed' : 'pointer',
                                    opacity: pwLoading ? 0.7 : 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem',
                                    boxShadow: '0 4px 16px rgba(239,68,68,0.3)'
                                }}
                            >
                                <Lock size={16} />
                                {pwLoading ? 'Updating...' : 'Update Password'}
                            </button>
                        </form>
                    </SectionCard>

                    {/* Generate Wallet */}
                    <SectionCard title="Generate New Sender Address" subtitle="Create a new Solana sender wallet for the platform" icon={Wallet} accentColor="#00C2FF">
                        {generatedWallet && (
                            <div style={{ background: 'rgba(0,194,255,0.08)', border: '1px solid rgba(0,194,255,0.2)', borderRadius: '12px', padding: '1rem', marginBottom: '1rem' }}>
                                <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600, marginBottom: '0.4rem' }}>New Public Key:</div>
                                <div style={{ fontFamily: 'monospace', color: '#00C2FF', fontSize: '0.8rem', wordBreak: 'break-all' }}>{generatedWallet.publicKey || generatedWallet.address}</div>
                            </div>
                        )}
                        <div
                            style={{
                                background: 'rgba(10, 14, 26, 0.8)',
                                borderRadius: '16px',
                                padding: '1.1rem 1.25rem',
                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                marginBottom: '1.25rem',
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', justify: 'space-between', marginBottom: '0.4rem' }}>
                                <span style={{ marginRight: "10px", color: '#94a3b8', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
                                    Active Deposite Address
                                </span>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
                                <code
                                    style={{
                                        fontFamily: 'monospace',
                                        fontSize: '1rem',
                                        color: '#14F195',
                                        fontWeight: 700,
                                        wordBreak: 'break-all',
                                    }}
                                >
                                    {settings.SOLANA_PLATFORM_PUBLIC_KEY || 'No wallet generated yet'}
                                </code>

                                {settings.SOLANA_PLATFORM_PUBLIC_KEY && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <CopyButton text={settings.SOLANA_PLATFORM_PUBLIC_KEY} />
                                        <a
                                            href={explorerUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '0.3rem',
                                                color: '#9945FF',
                                                fontSize: '0.8rem',
                                                fontWeight: 600,
                                                textDecoration: 'none',
                                                background: 'rgba(153, 69, 255, 0.12)',
                                                padding: '0.4rem 0.7rem',
                                                borderRadius: '8px',
                                                border: '1px solid rgba(153, 69, 255, 0.25)',
                                            }}
                                        >
                                            <span>Explorer</span>
                                            <ExternalLink size={13} />
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '12px', padding: '0.85rem 1rem', marginBottom: '1.25rem' }}>
                            <p style={{ color: '#fbbf24', fontSize: '0.82rem', margin: 0, lineHeight: 1.5 }}>
                                ⚠️ Generating a new address will deactivate the current wallet and save the new keys to the database.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={handleGenerateWallet}
                            disabled={genLoading}
                            style={{ width: '100%', padding: '0.85rem', borderRadius: '14px', background: 'linear-gradient(135deg, #00C2FF 0%, #0070ff 100%)', border: 'none', color: '#fff', fontWeight: 700, fontSize: '0.9rem', cursor: genLoading ? 'not-allowed' : 'pointer', opacity: genLoading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', boxShadow: '0 4px 16px rgba(0,194,255,0.3)' }}
                        >
                            {genLoading ? <RefreshCw size={16} className="animate-spin" /> : <Zap size={16} />}
                            {genLoading ? 'Generating...' : 'Generate New Wallet Address'}
                        </button>
                    </SectionCard>
                </div>

                {/* Right Column — Platform Settings */}
                <div>
                    <SectionCard title="Platform Settings" subtitle="Manage Solana keys and withdrawal fee" icon={KeyRound} accentColor="#14F195">
                        {fetchingSettings ? (
                            <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                                <div style={{ width: '28px', height: '28px', border: '3px solid rgba(20,241,149,0.2)', borderTop: '3px solid #14F195', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 0.75rem' }} />
                                Loading settings...
                            </div>
                        ) : (
                            <form onSubmit={handleSettingsSave}>
                                {settingsMsg && <Alert type={settingsMsg.type} message={settingsMsg.text} />}

                                {/* Public Key */}
                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.45rem' }}>
                                        SOLANA_SENDER_PUBLIC_KEY
                                        <span style={{ marginLeft: '0.5rem', padding: '0.1rem 0.45rem', borderRadius: '6px', background: 'rgba(20,241,149,0.1)', color: '#14F195', fontSize: '0.68rem' }}>Public</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={settings.SOLANA_SENDER_PUBLIC_KEY}
                                        onChange={e => setSettings(s => ({ ...s, SOLANA_SENDER_PUBLIC_KEY: e.target.value }))}
                                        placeholder="Solana public key (base58)"
                                        style={{ ...inputStyle, fontFamily: 'monospace', fontSize: '0.82rem' }}
                                    />
                                </div>

                                {/* Private Key */}
                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.45rem' }}>
                                        SOLANA_SENDER_PRIVATE_KEY
                                        <span style={{ marginLeft: '0.5rem', padding: '0.1rem 0.45rem', borderRadius: '6px', background: 'rgba(239,68,68,0.1)', color: '#fca5a5', fontSize: '0.68rem' }}>Secret</span>
                                    </label>
                                    <div style={{ position: 'relative' }}>
                                        <input
                                            type={showPrivKey ? 'text' : 'password'}
                                            value={settings.SOLANA_SENDER_PRIVATE_KEY}
                                            onChange={e => setSettings(s => ({ ...s, SOLANA_SENDER_PRIVATE_KEY: e.target.value }))}
                                            placeholder="Solana private key (base58)"
                                            style={{ ...inputStyle, fontFamily: 'monospace', fontSize: '0.82rem', paddingRight: '3rem' }}
                                        />
                                        <button type="button" onClick={() => setShowPrivKey(v => !v)} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 0 }}>
                                            {showPrivKey ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>

                                {/* Platform Fee */}
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.45rem' }}>
                                        WITHDRAWAL_PLATFORM_FEE
                                        <span style={{ marginLeft: '0.5rem', padding: '0.1rem 0.45rem', borderRadius: '6px', background: 'rgba(245,158,11,0.1)', color: '#f59e0b', fontSize: '0.68rem' }}>SOL amount</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={settings.WITHDRAWAL_PLATFORM_FEE}
                                        onChange={e => setSettings(s => ({ ...s, WITHDRAWAL_PLATFORM_FEE: e.target.value }))}
                                        placeholder="e.g. 0.001"
                                        style={inputStyle}
                                    />
                                    <p style={{ color: '#475569', fontSize: '0.75rem', marginTop: '0.4rem' }}>Fee deducted per withdrawal transaction (in SOL).</p>
                                </div>

                                <button
                                    type="submit"
                                    disabled={settingsLoading}
                                    style={{ width: '100%', padding: '0.85rem', borderRadius: '14px', background: 'linear-gradient(135deg, #9945FF 0%, #14F195 100%)', border: 'none', color: '#fff', fontWeight: 700, fontSize: '0.9rem', cursor: settingsLoading ? 'not-allowed' : 'pointer', opacity: settingsLoading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', boxShadow: '0 4px 16px rgba(153,69,255,0.3)' }}
                                >
                                    {settingsLoading ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
                                    {settingsLoading ? 'Saving...' : 'Save Platform Settings'}
                                </button>
                            </form>
                        )}
                    </SectionCard>
                </div>
            </div>
        </div>
    );
};