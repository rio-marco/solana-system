'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { QrCode, Copy, Check, Send, AlertCircle, CheckCircle, Tag } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { copyTextToClipboard } from '../lib/clipboard';

export const DepositSection = ({ onDepositSuccess }) => {
    const { user, updateUserData } = useAuth();
    const { toastError, toastSuccess, toastInfo } = useToast();
    const [address, setAddress] = useState('');
    const [amount, setAmount] = useState('');
    const [copied, setCopied] = useState(false);
    const [loading, setLoading] = useState(false);
    const [fetchingAddr, setFetchingAddr] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

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

    const copyToClipboard = async () => {
        if (address) {
            const ok = await copyTextToClipboard(address);
            if (ok) {
                setCopied(true);
                toastInfo('Deposit address copied to clipboard!');
                setTimeout(() => setCopied(false), 2000);
            };
        };
    };

    const handleDeposit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        const numAmount = parseFloat(amount);
        if (isNaN(numAmount) || numAmount <= 0) {
            const msg = 'Please enter a valid deposit amount.';
            setError(msg);
            toastError(msg);
            return;
        };

        try {
            setLoading(true);
            const res = await axios.post('/api/deposit/create', {
                memo: user?.memo || '',
                amount: numAmount,
            });

            if (res.data && res.data.flag) {
                const succMsg = res.data.msg || `Successfully deposited ${numAmount} SOL on Solana network!`;
                setSuccess(succMsg);
                toastSuccess(succMsg);
                setAmount('');

                if (res.data.data && res.data.data.updatedWalletBalance !== undefined) {
                    updateUserData({ walletBalance: res.data.data.updatedWalletBalance });
                };

                if (onDepositSuccess) onDepositSuccess();
            } else {
                const errMsg = res.data?.msg || res.data?.message || 'Deposit failed.';
                setError(errMsg);
                toastError(errMsg);
            };
        } catch (err) {
            const errMsg = err.response?.data?.msg || err.response?.data?.message || 'Deposit transaction failed on Solana network.';
            setError(errMsg);
            toastError(errMsg);
        } finally {
            setLoading(false);
        };
    };

    return (
        <div style={{ background: 'rgba(15, 20, 34, 0.85)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '24px', padding: '2rem', height: '100%', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <QrCode size={20} style={{ color: '#14F195' }} />
                    <span>Deposit System</span>
                </h2>
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

            <form onSubmit={handleDeposit}>
                {/* Deposit SOL Address Box */}
                <div className="form-group-custom">
                    <label className="solana-input-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <QrCode size={14} style={{ color: '#94a3b8' }} />
                        <span>DEPOSIT SOL ADDRESS</span>
                    </label>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <input
                            type="text"
                            className="solana-input-field font-mono"
                            value={address || (fetchingAddr ? 'Loading deposit address...' : 'No address generated')}
                            style={{ paddingLeft: '1rem', fontSize: '0.85rem', flex: 1, background: '#07090e', color: '#14F195' }}
                            readOnly
                        />
                        <button
                            type="button"
                            onClick={copyToClipboard}
                            disabled={!address}
                            className="solana-btn-outline"
                            style={{ width: 'auto', padding: '0 1.25rem', height: '48px', fontSize: '0.85rem', flexShrink: 0 }}
                        >
                            {copied ? <Check size={16} style={{ color: '#14F195' }} /> : <Copy size={16} />}
                            <span>{copied ? 'Copied' : 'Copy'}</span>
                        </button>
                    </div>
                </div>

                {/* Memo Tag Input Box (Disabled / Readonly) */}
                <div className="form-group-custom">
                    <label className="solana-input-label">Memo *</label>
                    <div className="solana-input-icon-wrapper">
                        <Tag className="input-svg-icon" style={{ color: '#94a3b8' }} />
                        <input
                            type="text"
                            className="solana-input-field font-mono"
                            value={user?.memo || ''}
                            style={{ paddingLeft: '3rem', fontWeight: 700, opacity: 0.85, background: 'rgba(7,9,14,0.6)' }}
                            disabled
                            readOnly
                        />
                    </div>
                </div>

                {/* Amount Input Box */}
                <div className="form-group-custom">
                    <label className="solana-input-label">Amount *</label>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <span className="font-mono" style={{ position: 'absolute', left: '1.1rem', fontWeight: 700, color: '#00C2FF', fontSize: '0.85rem', pointerEvents: 'none' }}>
                            SOL
                        </span>
                        <input
                            type="number"
                            step="0.0001"
                            min="0.0001"
                            className="solana-input-field font-mono"
                            placeholder="0.00"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            style={{ paddingLeft: '3.5rem' }}
                            required
                        />
                    </div>
                </div>

                {/* Submit Deposit Button */}
                <button
                    type="submit"
                    disabled={loading || !address}
                    className="solana-btn-primary"
                    style={{ marginTop: '0.75rem' }}
                >
                    {loading ? (
                        <span>Processing Deposit...</span>
                    ) : (
                        <>
                            <Send size={18} />
                            <span>Deposit</span>
                        </>
                    )}
                </button>
            </form>
        </div>
    );
};