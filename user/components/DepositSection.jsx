'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { QRCodeSVG } from 'qrcode.react';
import { QrCode, Copy, Check, AlertCircle, Tag, Wallet } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { copyTextToClipboard } from '../lib/clipboard';
import { PhantomDeposit } from './PhantomDeposit';

export const DepositSection = () => {
    const { user } = useAuth();
    const { toastError } = useToast();
    const [address, setAddress] = useState('');
    const [fetchingAddr, setFetchingAddr] = useState(false);
    const [copiedAddress, setCopiedAddress] = useState(false);
    const [copiedMemo, setCopiedMemo] = useState(false);
    const [error, setError] = useState(null);

    const memo = user?.memo || '';
    const balance = user?.btcrBalance !== undefined ? Number(user.btcrBalance).toFixed(8) : '0.00000000';

    const fetchAddress = async () => {
        try {
            setFetchingAddr(true);
            const res = await axios.get('/api/deposit/address');
            if (res.data && res.data.flag && res.data.data) {
                setAddress(res.data.data.address || '');
            };
        } catch (err) {
            const msg = 'Failed to fetch platform deposit address.';
            setError(msg);
            toastError(msg);
        } finally {
            setFetchingAddr(false);
        };
    };

    useEffect(() => {
        fetchAddress();
    }, []);

    const copyAddress = async () => {
        if (!address) return;
        const ok = await copyTextToClipboard(address);
        if (ok) {
            setCopiedAddress(true);
            setTimeout(() => setCopiedAddress(false), 2000);
        };
    };

    const copyMemo = async () => {
        if (!memo) return;
        const ok = await copyTextToClipboard(memo);
        if (ok) {
            setCopiedMemo(true);
            setTimeout(() => setCopiedMemo(false), 2000);
        };
    };

    return (
        <div style={{ background: 'rgba(15, 20, 34, 0.85)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '24px', padding: '1.5rem', height: '100%', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <QrCode size={20} style={{ color: '#14F195' }} />
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>By BTCR</h2>
            </div>

            <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', marginBottom: '1rem' }} />

            {error && (
                <div className="solana-alert-danger">
                    <AlertCircle size={18} />
                    <span>{error}</span>
                </div>
            )}

            {/* Current Balance */}
            <div style={{ marginBottom: '1.25rem' }}>
                <span className="solana-input-label" style={{ marginBottom: '0.3rem' }}>Current Balance</span>
                <div className="font-mono" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#14F195', fontSize: '1.2rem', fontWeight: 800 }}>
                    <Wallet size={20} />
                    <span>{balance} BTCR</span>
                </div>
            </div>

            {/* QR Code of admin-set deposit address */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', background: '#ffffff', color: "#000000", }}>
                <div style={{ padding: '1rem' }}>
                    {address ? (
                        <QRCodeSVG value={address} size={130} level="M" />
                    ) : (
                        <div style={{ width: 180, height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '0.8rem', textAlign: 'center' }}>
                            {fetchingAddr ? 'Loading address...' : 'No address configured'}
                        </div>
                    )}
                </div>
                <div style={{ fontSize: '0.8rem', paddingLeft: '1rem', paddingTop: '2rem' }}>
                    Scan or copy your SOL deposit address. Always include the memo.
                </div>
            </div>

            <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', marginBottom: '1rem' }} />

            {/* Deposit SOL Address */}
            <div className="form-group-custom">
                <label className="solana-input-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <QrCode size={14} style={{ color: '#94a3b8' }} />
                    <span>DEPOSIT SOL ADDRESS</span>
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input
                        type="text"
                        className="solana-input-field font-mono"
                        value={address || (fetchingAddr ? 'Loading deposit address...' : 'No address generated')}
                        style={{ paddingLeft: '1rem', paddingRight: '6.5rem', fontSize: '0.82rem', background: '#07090e', color: '#14F195' }}
                        readOnly
                    />
                    <button
                        type="button"
                        onClick={copyAddress}
                        disabled={!address}
                        className={`input-inline-copy${copiedAddress ? ' copied' : ''}`}
                    >
                        {copiedAddress ? <Check size={14} /> : <Copy size={14} />}
                        <span>{copiedAddress ? 'Copied' : 'Copy'}</span>
                    </button>
                </div>
            </div>

            {/* Memo Tag (Readonly) */}
            <div className="form-group-custom">
                <label className="solana-input-label">Memo</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <Tag size={15} style={{ position: 'absolute', left: '1.1rem', color: '#94a3b8', zIndex: 5, pointerEvents: 'none' }} />
                    <input
                        type="text"
                        className="solana-input-field font-mono"
                        value={memo}
                        style={{ paddingLeft: '3rem', paddingRight: '6.5rem', fontWeight: 700, opacity: 0.9, background: 'rgba(7,9,14,0.6)' }}
                        readOnly
                    />
                    <button
                        type="button"
                        onClick={copyMemo}
                        disabled={!memo}
                        className={`input-inline-copy${copiedMemo ? ' copied' : ''}`}
                    >
                        {copiedMemo ? <Check size={14} /> : <Copy size={14} />}
                        <span>{copiedMemo ? 'Copied' : 'Copy'}</span>
                    </button>
                </div>
            </div>

            <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', margin: '1.25rem 0' }} />

            <PhantomDeposit />

            {/* Important Notice */}
            <div
                style={{
                    marginTop: '1.25rem',
                    background: 'rgba(239, 68, 68, 0.12)',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    borderLeft: '4px solid #ef4444',
                    borderRadius: '14px',
                    padding: '1rem',
                    display: 'flex',
                    gap: '0.65rem',
                    alignItems: 'flex-start',
                }}
            >
                <AlertCircle size={18} style={{ color: '#ef4444', flexShrink: 0, marginTop: '2px' }} />
                <div>
                    <div style={{ color: '#ef4444', fontWeight: 800, fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '0.3rem' }}>
                        Important Notice
                    </div>
                    <p style={{ color: '#fca5a5', fontSize: '0.82rem', lineHeight: 1.5, margin: 0 }}>
                        Only send SOL to this address and make sure to include the correct memo. Deposits sent without a memo or using any other coin/network may result in permanent loss of funds.
                    </p>
                </div>
            </div>
        </div>
    );
};