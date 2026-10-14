'use client';

import React, { useState } from 'react';
import { CopyButton } from '../lib/clipboard';
import { Wallet, RefreshCw, Key, ExternalLink, ShieldCheck, AlertCircle } from 'lucide-react';
import { useToast } from '../context/ToastContext';

export function AdminWalletCard({ walletData, onRefresh, onGenerateWallet, generating }) {
    const { toastError, toastSuccess } = useToast();
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    const handleConfirmGenerate = async () => {
        setShowConfirmModal(false);
        try {
            await onGenerateWallet();
        } catch (err) {
            toastError(err.message || 'Failed to generate new wallet.', 'error');
        };
    };

    const explorerUrl = walletData?.address
        ? `https://explorer.solana.com/address/${walletData.address}?cluster=${walletData.network || 'devnet'}`
        : '#';

    return (
        <div
            style={{
                background: '#FFFFFF',
                borderRadius: '6px',
                border: '1px solid #DEE2E6',
                padding: '1.5rem',
                overflow: 'hidden',
            }}
        >

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div
                        style={{
                            width: '44px',
                            height: '44px',
                            borderRadius: '6px',
                            background: '#E7F1FF',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#0D6EFD',
                        }}
                    >
                        <Wallet size={20} />
                    </div>
                    <div>
                        <h2 style={{ color: '#212529', fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>
                            Admin Generated Platform Wallet Address
                        </h2>
                        <p style={{ color: '#6C757D', fontSize: '0.82rem', margin: '2px 0 0 0' }}>
                            Unified wallet for user deposit collection and withdrawal transfers
                        </p>
                    </div>
                </div>
            </div>

            {/* Generated Address Box */}
            <div
                style={{
                    background: '#F8F9FA',
                    borderRadius: '6px',
                    padding: '1.1rem 1.25rem',
                    border: '1px solid #DEE2E6',
                    marginBottom: '1.25rem',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', justify: 'space-between', marginBottom: '0.4rem' }}>
                    <span
                        style={{
                            marginRight: "10px",
                            color: '#6C757D',
                            fontSize: '0.78rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            fontWeight: 700,
                        }}
                    >
                        ACTIVE DEPOSIT ADDRESS
                    </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <code
                        style={{
                            fontFamily: 'monospace',
                            fontSize: '1rem',
                            color: '#198754',
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
                                    color: '#0D6EFD',
                                    fontSize: '0.8rem',
                                    fontWeight: 600,
                                    textDecoration: 'none',
                                    background: '#E7F1FF',
                                    padding: '0.4rem 0.7rem',
                                    borderRadius: '6px',
                                    border: '1px solid #DEE2E6',
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
                        background: '#F8F9FA',
                        border: '1px solid #DEE2E6',
                        borderRadius: '6px',
                        padding: '1rem 1.25rem',
                    }}
                >
                    <span style={{ color: '#6C757D', fontSize: '0.8rem', fontWeight: 600 }}>Live On-Chain Address Balance</span>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', marginTop: '0.3rem' }}>
                        <span style={{ fontSize: '1.6rem', fontWeight: 700, color: '#212529' }}>
                            {walletData?.balance !== undefined ? walletData.balance.toFixed(8) : '0.00'}
                        </span>
                        <span style={{ color: '#6C757D', fontWeight: 700, fontSize: '1rem' }}>SOL</span>
                    </div>
                </div>

                <div
                    style={{
                        background: '#F8F9FA',
                        border: '1px solid #DEE2E6',
                        borderRadius: '6px',
                        padding: '1rem 1.25rem',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#212529', fontWeight: 600, fontSize: '0.85rem' }}>
                        <ShieldCheck size={16} />
                        <span>Address Usage Confirmation</span>
                    </div>
                    <p style={{ color: '#6C757D', fontSize: '0.78rem', margin: '0.3rem 0 0 0', lineHeight: 1.35 }}>
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
                            background: '#FFFFFF',
                            border: '1px solid #DEE2E6',
                            borderRadius: '6px',
                            padding: '1.5rem',
                            maxWidth: '480px',
                            width: '100%',
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#212529', marginBottom: '1rem' }}>
                            <AlertCircle size={24} style={{ color: '#DC3545' }} />
                            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Generate New Admin Wallet?</h3>
                        </div>

                        <p style={{ color: '#6C757D', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: '1.25rem' }}>
                            Generating a new Solana wallet address will deactivate the previous platform deposit address. Future user deposit transfers will target this new address.
                        </p>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                            <button
                                type="button"
                                onClick={() => setShowConfirmModal(false)}
                                style={{
                                    background: '#FFFFFF',
                                    border: '1px solid #DEE2E6',
                                    color: '#212529',
                                    padding: '0.6rem 1.25rem',
                                    borderRadius: '6px',
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
                                    background: '#DC3545',
                                    border: '1px solid #DC3545',
                                    color: '#FFFFFF',
                                    padding: '0.6rem 1.25rem',
                                    borderRadius: '6px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
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
