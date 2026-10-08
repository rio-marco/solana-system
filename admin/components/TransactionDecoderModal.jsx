'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Code, Search, AlertCircle, X } from 'lucide-react';

const BASE58_REGEX = /^[1-9A-HJ-NP-Za-km-z]+$/;

export const TransactionDecoderModal = ({ isOpen, onClose }) => {
    const [signature, setSignature] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    // Reset state whenever modal opens or closes
    useEffect(() => {
        if (!isOpen) {
            setSignature('');
            setResult(null);
            setError(null);
            setLoading(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleClose = () => {
        setSignature('');
        setResult(null);
        setError(null);
        setLoading(false);
        onClose();
    };

    const handleDecode = async (e) => {
        e.preventDefault();
        setError(null);
        setResult(null);

        const cleanSig = signature.trim();

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
    };

    return (
        <div className="solana-modal-overlay">
            <div className="solana-modal-card" style={{ maxWidth: '640px' }}>
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
                    Paste a Solana transaction signature (tx hash) to inspect instructions and transfer details.
                </p>

                {error && (
                    <div className="solana-alert-danger">
                        <AlertCircle size={18} style={{ flexShrink: 0 }} />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleDecode} style={{ marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input
                            type="text"
                            className="solana-input-field font-mono"
                            placeholder="e.g. 5Kx8...x9Zq"
                            value={signature}
                            onChange={(e) => setSignature(e.target.value)}
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

                {result && (
                    <div style={{ background: '#07090e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', padding: '1rem', maxHeight: '300px', overflowY: 'auto' }}>
                        <h4 style={{ fontSize: '0.75rem', fontWeight: 700, color: '#00C2FF', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.5rem' }}>Decoded Instruction Data</h4>
                        <pre className="font-mono" style={{ fontSize: '0.75rem', color: '#14F195', whiteSpace: 'pre-wrap', wordBreak: 'break-all', margin: 0 }}>
                            {JSON.stringify(result, null, 2)}
                        </pre>
                    </div>
                )}
            </div>
        </div>
    );
};