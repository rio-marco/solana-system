'use client';

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Code, Search, AlertCircle, X } from 'lucide-react';

const BASE58_REGEX = /^[1-9A-HJ-NP-Za-km-z]+$/;

export const TransactionDecoderModal = ({ isOpen, initialSignature = '', signature = '', onClose }) => {
    const activeSig = initialSignature || signature || '';
    const isModalOpen = isOpen !== undefined ? isOpen : !!activeSig;

    const [inputSig, setInputSig] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    const executeDecode = useCallback(async (sigToDecode) => {
        const cleanSig = (sigToDecode || '').trim();

        if (!cleanSig) {
            setError('Transaction signature is required.');
            return;
        };

        // Frontend validation before calling API
        if (cleanSig.length < 80 || cleanSig.length > 95 || !BASE58_REGEX.test(cleanSig)) {
            setError('Invalid Solana transaction signature format. Signature must be a valid Base58 string (80-90 characters).');
            return;
        };

        try {
            setLoading(true);
            setError(null);
            setResult(null);
            const res = await axios.post('/api/transaction/decode', { signature: cleanSig });
            if (res.data && res.data.flag && res.data.data) {
                setResult(res.data.data);
            } else {
                setError(res.data?.msg || res.data?.message || 'Could not decode transaction.');
            };
        } catch (err) {
            const errMsg = err.response?.data?.msg || err.response?.data?.message || err.message || 'Error decoding transaction signature.';
            setError(errMsg);
        } finally {
            setLoading(false);
        };
    }, []);

    // When modal opens or activeSignature changes
    useEffect(() => {
        if (isModalOpen) {
            if (activeSig) {
                setInputSig(activeSig);
                executeDecode(activeSig);
            } else {
                setInputSig('');
                setResult(null);
                setError(null);
            };
        } else {
            setInputSig('');
            setResult(null);
            setError(null);
            setLoading(false);
        };
    }, [isModalOpen, activeSig, executeDecode]);

    if (!isModalOpen) return null;

    const handleClose = () => {
        setInputSig('');
        setResult(null);
        setError(null);
        setLoading(false);
        if (onClose) onClose();
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        executeDecode(inputSig);
    };

    return (
        <div className="solana-modal-overlay">
            <div className="solana-modal-card" style={{ maxWidth: '680px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Code style={{ color: '#00C2FF' }} size={20} />
                        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff' }}>Solana Transaction Decoder</h3>
                    </div>
                    <button type="button" onClick={handleClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                        <X size={20} />
                    </button>
                </div>

                <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '1rem' }}>
                    Inspect Solana transaction instructions, transfer accounts, and block log details.
                </p>

                {error && (
                    <div className="solana-alert-danger" style={{ marginBottom: '1rem' }}>
                        <AlertCircle size={18} style={{ flexShrink: 0 }} />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ marginBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input
                            type="text"
                            className="solana-input-field font-mono"
                            placeholder="e.g. 5Kx8...x9Zq"
                            value={inputSig}
                            onChange={(e) => setInputSig(e.target.value)}
                            style={{ paddingLeft: '1rem', fontSize: '0.8rem', flex: 1 }}
                            required
                        />
                        <button type="submit" disabled={loading} className="solana-btn-primary" style={{ width: 'auto', padding: '0 1.25rem', height: '48px' }}>
                            {loading ? (
                                'Decoding...'
                            ) : (
                                <>
                                    <Search size={16} />
                                    <span>Decode</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>

                {loading && (
                    <div style={{ textAlign: 'center', padding: '2rem 0', color: '#00C2FF' }} className="font-mono text-sm">
                        <div className="w-8 h-8 border-3 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                        <span>Decoding transaction on Solana blockchain...</span>
                    </div>
                )}

                {result && !loading && (
                    <div style={{ background: '#07090e', border: '1px solid rgba(0, 194, 255, 0.25)', borderRadius: '14px', padding: '1rem', maxHeight: '340px', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <h4 style={{ fontSize: '0.78rem', fontWeight: 800, color: '#00C2FF', textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 }}>
                                Decoded Transaction JSON Data
                            </h4>
                            <span style={{ fontSize: '0.7rem', color: '#14F195', background: 'rgba(20, 241, 149, 0.12)', padding: '0.15rem 0.5rem', borderRadius: '10px', border: '1px solid rgba(20, 241, 149, 0.3)', fontWeight: 700 }}>
                                Verified On-Chain
                            </span>
                        </div>
                        <pre className="font-mono" style={{ fontSize: '0.78rem', color: '#14F195', whiteSpace: 'pre-wrap', wordBreak: 'break-all', margin: 0, lineHeight: 1.45 }}>
                            {JSON.stringify(result, null, 2)}
                        </pre>
                    </div>
                )}
            </div>
        </div>
    );
};