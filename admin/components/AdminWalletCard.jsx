'use client';

import React, { useState } from 'react';
import { CopyButton } from '../lib/clipboard';
import { Wallet, RefreshCw, Key, ExternalLink, ShieldCheck, AlertCircle } from 'lucide-react';
import { useToast } from '../context/ToastContext';

export function AdminWalletCard({ walletData, onRefresh, onGenerateWallet, generating }) {
    const { addToast } = useToast();
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    const handleConfirmGenerate = async () => {
        setShowConfirmModal(false);
        try {
            await onGenerateWallet();
        } catch (err) {
            addToast(err.message || 'Failed to generate new wallet.', 'error');
        };
    };

    const explorerUrl = walletData?.address
        ? `https://explorer.solana.com/address/${walletData.address}?cluster=${walletData.network || 'devnet'}`
        : '#';

    return (
        <div
            className="glass-card"
            style={{
                background: 'linear-gradient(135deg, rgba(20, 24, 40, 0.95) 0%, rgba(15, 20, 32, 0.98) 100%)',
                borderRadius: '24px',
                border: '1px solid rgba(153, 69, 255, 0.25)',
                padding: '1.75rem',
                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4), 0 0 30px rgba(153, 69, 255, 0.1)',
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            {/* Top accent glow line */}
            <div
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '3px',
                    background: 'linear-gradient(90deg, #9945FF 0%, #14F195 100%)',
                }}
            />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div
                        style={{
                            width: '44px',
                            height: '44px',
                            borderRadius: '14px',
                            background: 'rgba(153, 69, 255, 0.15)',
                            border: '1px solid rgba(153, 69, 255, 0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#14F195',
                        }}
                    >
                        <Wallet size={24} />
                    </div>
                    <div>
                        <h2 style={{ color: '#ffffff', fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>
                            Admin Generated Platform Wallet Address
                        </h2>
                        <p style={{ color: '#94a3b8', fontSize: '0.82rem', margin: '2px 0 0 0' }}>
                            Unified wallet for user deposit collection & withdrawal transfers
                        </p>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <button
                        type="button"
                        onClick={onRefresh}
                        style={{
                            background: 'rgba(255, 255, 255, 0.06)',
                            border: '1px solid rgba(255, 255, 255, 0.12)',
                            color: '#cbd5e1',
                            padding: '0.5rem 0.9rem',
                            borderRadius: '10px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            fontSize: '0.82rem',
                            fontWeight: 600,
                            transition: 'all 0.2s ease',
                        }}
                        title="Refresh On-Chain Balance"
                    >
                        <RefreshCw size={14} className={generating ? 'animate-spin' : ''} />
                        <span>Refresh</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setShowConfirmModal(true)}
                        disabled={generating}
                        style={{
                            background: 'linear-gradient(135deg, #9945FF 0%, #7c2d12 0%, #dc2626 100%)',
                            border: 'none',
                            color: '#ffffff',
                            padding: '0.55rem 1.1rem',
                            borderRadius: '10px',
                            cursor: generating ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.45rem',
                            fontSize: '0.85rem',
                            fontWeight: 700,
                            boxShadow: '0 4px 14px rgba(220, 38, 38, 0.35)',
                            transition: 'all 0.2s ease',
                        }}
                    >
                        <Key size={15} />
                        <span>{generating ? 'Generating...' : 'Generate New Address'}</span>
                    </button>
                </div>
            </div>

            {/* Generated Address Box */}
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
                    <span
                        style={{
                            background: 'rgba(20, 241, 149, 0.12)',
                            color: '#14F195',
                            border: '1px solid rgba(20, 241, 149, 0.3)',
                            padding: '0.15rem 0.6rem',
                            borderRadius: '20px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                        }}
                    >
                        {walletData?.network || 'devnet'} network
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
                        {walletData?.address || 'No wallet generated yet'}
                    </code>

                    {walletData?.address && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <CopyButton text={walletData.address} />
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

            {/* Live On-Chain Balance Metric */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                <div
                    style={{
                        background: 'rgba(20, 241, 149, 0.05)',
                        border: '1px solid rgba(20, 241, 149, 0.2)',
                        borderRadius: '14px',
                        padding: '1rem 1.25rem',
                    }}
                >
                    <span style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: 600 }}>Live On-Chain Address Balance</span>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', marginTop: '0.3rem' }}>
                        <span style={{ fontSize: '1.8rem', fontWeight: 900, color: '#14F195' }}>
                            {walletData?.balance !== undefined ? walletData.balance : '0.00'}
                        </span>
                        <span style={{ color: '#14F195', fontWeight: 800, fontSize: '1rem' }}>SOL</span>
                    </div>
                </div>

                <div
                    style={{
                        background: 'rgba(153, 69, 255, 0.05)',
                        border: '1px solid rgba(153, 69, 255, 0.2)',
                        borderRadius: '14px',
                        padding: '1rem 1.25rem',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#a855f7', fontWeight: 700, fontSize: '0.85rem' }}>
                        <ShieldCheck size={16} />
                        <span>Address Usage Confirmation</span>
                    </div>
                    <p style={{ color: '#94a3b8', fontSize: '0.78rem', margin: '0.3rem 0 0 0', lineHeight: 1.35 }}>
                        Users will send deposits to this address. Withdrawals will also be signed and transferred from this wallet.
                    </p>
                </div>
            </div>

            {/* Confirmation Modal for Generating New Address */}
            {showConfirmModal && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0, 0, 0, 0.75)',
                        backdropFilter: 'blur(6px)',
                        zIndex: 9999,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '1rem',
                    }}
                >
                    <div
                        style={{
                            background: '#0f172a',
                            border: '1px solid rgba(239, 68, 68, 0.4)',
                            borderRadius: '20px',
                            padding: '1.75rem',
                            maxWidth: '480px',
                            width: '100%',
                            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.6)',
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#ef4444', marginBottom: '1rem' }}>
                            <AlertCircle size={28} />
                            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>Generate New Admin Wallet?</h3>
                        </div>

                        <p style={{ color: '#cbd5e1', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: '1.25rem' }}>
                            Generating a new Solana wallet address will deactivate the previous platform deposit address. Future user deposit transfers will target this new address.
                        </p>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                            <button
                                type="button"
                                onClick={() => setShowConfirmModal(false)}
                                style={{
                                    background: 'rgba(255, 255, 255, 0.08)',
                                    border: '1px solid rgba(255, 255, 255, 0.15)',
                                    color: '#ffffff',
                                    padding: '0.6rem 1.25rem',
                                    borderRadius: '10px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmGenerate}
                                style={{
                                    background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
                                    border: 'none',
                                    color: '#ffffff',
                                    padding: '0.6rem 1.25rem',
                                    borderRadius: '10px',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    boxShadow: '0 4px 14px rgba(239, 68, 68, 0.4)',
                                }}
                            >
                                Yes, Generate Address
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
