'use client';

import React, { useState } from 'react';
import axios from 'axios';
import { ArrowUpRight, Send, AlertCircle, CheckCircle, Tag, Wallet, Banknote } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const WithdrawSection = () => {
    const { user, updateUserData } = useAuth();
    const { toastError, toastSuccess } = useToast();
    const [toAddress, setToAddress] = useState('');
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    const memo = user?.memo || '';
    const availableWithdrawBalance = user?.availableWithdrawBalance !== undefined ? Number(user.availableWithdrawBalance).toFixed(8) : '0.00000000';

    const handleAmountChange = (e) => {
        let val = e.target.value.replace(/[^0-9.]/g, '');
        const parts = val.split('.');

        if (parts.length > 2) {
            val = `${parts[0]}.${parts.slice(1).join('')}`;
        };

        if (parts[1] && parts[1].length > 9) {
            val = `${parts[0]}.${parts[1].slice(0, 9)}`;
        };

        setAmount(val);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        const numAmount = parseFloat(amount);
        if (!toAddress.trim()) {
            const msg = 'Destination address is required.';
            setError(msg);
            toastError(msg);
            return;
        };

        if (isNaN(numAmount) || numAmount <= 0) {
            const msg = 'Please enter a valid withdrawal amount.';
            setError(msg);
            toastError(msg);
            return;
        };

        try {
            setLoading(true);
            const res = await axios.post('/api/withdraw/create', {
                toAddress: toAddress.trim(),
                amount: numAmount,
                memo: memo,
            });

            if (res.data && res.data.flag) {
                const succMsg = res.data.msg || 'Withdrawal transaction executed & confirmed!';
                setSuccess(succMsg);
                toastSuccess(succMsg);
                setToAddress('');
                setAmount('');

                updateUserData({
                    btcrBalance: res.data.data.btcrBalance,
                    availableWithdrawBalance: res.data.data.availableWithdrawBalance,
                });

                setTimeout(() => setSuccess(null), 3000);
            } else {
                const errMsg = res.data?.msg || res.data?.message || 'Withdrawal failed.';
                setError(errMsg);
                toastError(errMsg);
            };
        } catch (err) {
            const errMsg = err.response?.data?.msg || err.response?.data?.message || 'Error processing withdrawal.';
            setError(errMsg);
            toastError(errMsg);
        } finally {
            setLoading(false);
        };
    };

    return (
        <div style={{ background: 'rgba(15, 20, 34, 0.85)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '24px', padding: '2rem', height: '100%', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                <ArrowUpRight size={20} style={{ color: '#00C2FF' }} />
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>Withdraw</h2>
            </div>

            <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', marginBottom: '1.5rem' }} />

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

            {/* Current Balance */}
            <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#94a3b8', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <Banknote size={16} style={{ color: '#00C2FF' }} />
                    <span>Available Withdraw Balance</span>
                </div>
                <div className="font-mono" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#00C2FF', fontSize: '1.6rem', fontWeight: 800 }}>
                    <span>{availableWithdrawBalance} BTCR</span>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                {/* Destination Address */}
                <div className="form-group-custom">
                    <label className="solana-input-label">DESTINATION ADDRESS *</label>
                    <div className="solana-input-icon-wrapper">
                        <Wallet className="input-svg-icon" style={{ color: '#94a3b8' }} />
                        <input
                            type="text"
                            className="solana-input-field font-mono"
                            placeholder="Paste recipient wallet address"
                            value={toAddress}
                            onChange={(e) => setToAddress(e.target.value)}
                            style={{ fontSize: '0.85rem' }}
                            required
                        />
                    </div>
                </div>

                {/* Amount (numeric only) */}
                <div className="form-group-custom">
                    <label className="solana-input-label">Amount *</label>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <span className="font-mono" style={{ position: 'absolute', left: '1.1rem', fontWeight: 700, color: '#00C2FF', fontSize: '1rem', pointerEvents: 'none' }}>
                            BTCR :
                        </span>
                        <input
                            type="text"
                            inputMode="decimal"
                            autoComplete="off"
                            className="solana-input-field font-mono"
                            placeholder="Enter withdraw amount"
                            value={amount}
                            onChange={handleAmountChange}
                            style={{ paddingLeft: '5.2rem' }}
                            required
                        />
                    </div>
                </div>

                {/* Memo (auto-filled, readonly) */}
                <div className="form-group-custom">
                    <label className="solana-input-label">Memo</label>
                    <div className="solana-input-icon-wrapper">
                        <Tag className="input-svg-icon" style={{ color: '#94a3b8' }} />
                        <input
                            type="text"
                            className="solana-input-field font-mono"
                            value={memo}
                            style={{ paddingLeft: '3rem', fontWeight: 700, opacity: 0.85, background: 'rgba(7,9,14,0.6)' }}
                            readOnly
                        />
                    </div>
                </div>

                {/* Submit Withdraw Button */}
                <button
                    type="submit"
                    disabled={loading || availableWithdrawBalance <= 0}
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