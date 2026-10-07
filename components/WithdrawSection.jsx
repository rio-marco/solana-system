'use client';

import React, { useState } from 'react';
import axios from 'axios';
import { ArrowUpRight, Send, AlertCircle, CheckCircle, Tag, Wallet } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const WithdrawSection = ({ onWithdrawSuccess }) => {
    const { user, updateUserData } = useAuth();
    const { toastError, toastSuccess } = useToast();
    const [toAddress, setToAddress] = useState('');
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        const numAmount = parseFloat(amount);
        if (!toAddress.trim()) {
            const msg = 'Target Solana wallet address is required.';
            setError(msg);
            toastError(msg);
            return;
        };

        if (isNaN(numAmount) || numAmount <= 0) {
            const msg = 'Please enter a valid SOL withdrawal amount.';
            setError(msg);
            toastError(msg);
            return;
        };

        try {
            setLoading(true);
            const res = await axios.post('/api/withdraw/create', {
                toAddress: toAddress.trim(),
                amount: numAmount,
                memo: user?.memo || '',
            });

            if (res.data && res.data.flag) {
                const succMsg = res.data.msg || 'Withdrawal transaction executed & confirmed on Solana!';
                setSuccess(succMsg);
                toastSuccess(succMsg);
                setToAddress('');
                setAmount('');

                if (res.data.data && res.data.data.updatedWalletBalance !== undefined) {
                    updateUserData({ walletBalance: res.data.data.updatedWalletBalance });
                };

                if (onWithdrawSuccess) onWithdrawSuccess();

                setTimeout(() => setSuccess(null), 3000);
            } else {
                const errMsg = res.data?.msg || res.data?.message || 'Withdrawal failed.';
                setError(errMsg);
                toastError(errMsg);
            };
        } catch (err) {
            const errMsg = err.response?.data?.msg || err.response?.data?.message || 'Error processing Solana withdrawal.';
            setError(errMsg);
            toastError(errMsg);
        } finally {
            setLoading(false);
        };
    };

    return (
        <div style={{ background: 'rgba(15, 20, 34, 0.85)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '24px', padding: '2rem', height: '100%', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <ArrowUpRight size={20} style={{ color: '#00C2FF' }} />
                    <span>Withdraw</span>
                </h2>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>
                    Max Withdrawable: <strong className="font-mono" style={{ color: '#00C2FF' }}>{user?.walletBalance !== undefined ? Number(user.walletBalance).toFixed(6) : '0.000000'} SOL</strong>
                </span>
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
                {/* To Address Box */}
                <div className="form-group-custom">
                    <label className="solana-input-label">To Address *</label>
                    <div className="solana-input-icon-wrapper">
                        <Wallet className="input-svg-icon" style={{ color: '#94a3b8' }} />
                        <input
                            type="text"
                            className="solana-input-field font-mono"
                            placeholder="Paste recipient Solana wallet address"
                            value={toAddress}
                            onChange={(e) => setToAddress(e.target.value)}
                            style={{ fontSize: '0.85rem' }}
                            required
                        />
                    </div>
                </div>

                {/* Memo Input Box (Disabled / Readonly) */}
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
                            placeholder="Enter withdraw amount"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            style={{ paddingLeft: '3.5rem' }}
                            required
                        />
                    </div>
                </div>

                {/* Submit Withdraw Button */}
                <button
                    type="submit"
                    disabled={loading}
                    className="solana-btn-primary"
                    style={{ marginTop: '0.75rem' }}
                >
                    {loading ? (
                        <span>Processing Withdraw...</span>
                    ) : (
                        <>
                            <Send size={18} />
                            <span>Withdraw</span>
                        </>
                    )}
                </button>
            </form>
        </div>
    );
};