'use client';

import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { Connection, PublicKey, SystemProgram, Transaction, TransactionInstruction } from '@solana/web3.js';
import bs58 from 'bs58';
import {
    Wallet,
    PlugZap,
    Send,
    Loader2,
    CheckCircle2,
    ExternalLink,
    AlertCircle,
    Copy,
    Check,
    ShieldCheck,
    Unplug,
    Info,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useToast } from '../context/ToastContext';
import { usePhantom, getPhantomProvider } from '../lib/usePhantom.mjs';
import { copyTextToClipboard } from '../lib/clipboard';
import {
    parseSolAmount,
    sanitizeSolInput,
    shortAddress,
    getExplorerTxUrl,
    isValidSolanaAddress,
    DEFAULT_MAX_DEPOSIT_SOL,
} from '../lib/solana-client.mjs';

const STATUS = {
    IDLE: 'idle',
    LOADING_CONFIG: 'loading_config',
    CONNECTING: 'connecting',
    AWAITING_APPROVAL: 'awaiting_approval',
    SUBMITTING: 'submitting',
    CONFIRMING: 'confirming',
    ONCHAIN_CONFIRMED: 'onchain_confirmed',
    CREDITED: 'credited',
    ERROR: 'error',
};

const BUSY_STATUSES = [
    STATUS.CONNECTING,
    STATUS.AWAITING_APPROVAL,
    STATUS.SUBMITTING,
    STATUS.CONFIRMING,
];

const FEE_BUFFER_LAMPORTS = BigInt(5000);

const extractSignature = (signedTx) => {
    try {
        if (!signedTx) return null;

        if (signedTx.signature) {
            return typeof signedTx.signature === 'string' ? signedTx.signature : bs58.encode(signedTx.signature);
        };

        const firstSignature = signedTx?.signatures?.[0]?.signature;
        if (firstSignature) {
            return bs58.encode(firstSignature);
        };
    } catch (e) {
        return null;
    };

    return null;
};

const isUserRejected = (err) => {
    const code = err?.code;
    const message = String(err?.message || '');
    return code === 4001 || /user rejected|user denied|rejected by user|request rejected/i.test(message);
};

const mapPhantomError = (err) => {
    const code = err?.code;
    const message = String(err?.message || '');

    if (code === 4001 || /user rejected|user denied|rejected by user/i.test(message)) {
        return 'You rejected the request in Phantom.';
    };

    if (code === 4900 || /not connected|wallet is disconnected|disconnected/i.test(message)) {
        return 'Phantom wallet is not connected. Please reconnect and try again.';
    };

    if (/insufficient (lamports|funds)|insufficient funds for rent|0x1\b/i.test(message)) {
        return 'Insufficient SOL in your Phantom wallet to cover the deposit amount and network fee.';
    };

    if (/blockhash not found|block height exceeded|expired|transaction was not confirmed/i.test(message)) {
        return 'The network blockhash expired before confirmation. Check the explorer link before retrying.';
    };

    if (/429|too many requests|rate limit/i.test(message)) {
        return 'Solana RPC rate limit reached. Please wait a moment and try again.';
    };

    if (/not installed|not detected/i.test(message)) {
        return 'Phantom wallet is not installed. Please install the Phantom extension.';
    };

    return message || 'Deposit failed. Please try again.';
};

const getStatusView = (status, errorMsg) => {
    switch (status) {
        case STATUS.LOADING_CONFIG:
            return { label: 'Loading deposit configuration...', color: '#94a3b8', busy: true };
        case STATUS.CONNECTING:
            return { label: 'Connecting to Phantom...', color: '#F59E0B', busy: true };
        case STATUS.AWAITING_APPROVAL:
            return { label: 'Waiting for approval in Phantom...', color: '#F59E0B', busy: true };
        case STATUS.SUBMITTING:
            return { label: 'Submitting to Solana network...', color: '#00C2FF', busy: true };
        case STATUS.CONFIRMING:
            return { label: 'Confirming on Solana network...', color: '#00C2FF', busy: true };
        case STATUS.ONCHAIN_CONFIRMED:
            return { label: 'Transaction confirmed on Solana. Your deposit is being processed.', color: '#14F195', busy: true };
        case STATUS.CREDITED:
            return { label: 'Deposit credited to your account.', color: '#14F195', busy: false };
        case STATUS.ERROR:
            return { label: errorMsg || 'Deposit failed.', color: '#ef4444', busy: false };
        default:
            return null;
    };
};

export const PhantomDeposit = () => {
    const { config, refreshUser } = useAuth();
    const socket = useSocket();
    const { toastError, toastSuccess, toastInfo } = useToast();
    const { provider, publicKey, isPhantomInstalled, connecting, connect, disconnect } = usePhantom();

    const [depositConfig, setDepositConfig] = useState(null);
    const [configError, setConfigError] = useState(null);
    const [amount, setAmount] = useState('');
    const [status, setStatus] = useState(STATUS.LOADING_CONFIG);
    const [errorMsg, setErrorMsg] = useState(null);
    const [signature, setSignature] = useState(null);
    const [copied, setCopied] = useState(false);

    const network = depositConfig?.network || config?.network || 'devnet';
    const maxDepositSol = depositConfig?.maxDepositSol || DEFAULT_MAX_DEPOSIT_SOL;
    const busy = BUSY_STATUSES.includes(status) || connecting;

    const fetchConfig = useCallback(async () => {
        try {
            setStatus(STATUS.LOADING_CONFIG);
            const res = await axios.get('/api/deposit/config');

            if (res.data && res.data.flag && res.data.data) {
                setDepositConfig(res.data.data);
                setConfigError(null);
                setStatus(STATUS.IDLE);
            } else {
                const msg = res.data?.msg || 'Unable to load deposit configuration.';
                setConfigError(msg);
                setStatus(STATUS.ERROR);
                setErrorMsg(msg);
            };
        } catch (err) {
            const msg = err.response?.data?.msg || 'Unable to load deposit configuration.';
            setConfigError(msg);
            setStatus(STATUS.ERROR);
            setErrorMsg(msg);
        };
    }, []);

    useEffect(() => {
        fetchConfig();
    }, [fetchConfig]);

    useEffect(() => {
        if (!socket || !signature) return;

        const handleDepositConfirmed = (payload) => {
            if (payload && payload.signature === signature) {
                setStatus((prev) => (prev === STATUS.CREDITED ? prev : STATUS.CREDITED));
                refreshUser?.();
                toastSuccess('Deposit verified and credited to your account.');
            };
        };

        socket.on('deposit_confirmed', handleDepositConfirmed);

        return () => {
            socket.off('deposit_confirmed', handleDepositConfirmed);
        };
    }, [socket, signature, refreshUser, toastSuccess]);

    useEffect(() => {
        if (status !== STATUS.ONCHAIN_CONFIRMED || !signature) return;

        let cancelled = false;
        const startedAt = Date.now();

        const poll = async () => {
            if (cancelled) return;

            try {
                const res = await axios.get('/api/deposit/list', { params: { page: 1, limit: 20 } });
                const list = res.data?.data?.deposits || [];

                if (list.some((item) => item.transactionSignature === signature)) {
                    if (!cancelled) {
                        setStatus(STATUS.CREDITED);
                        refreshUser?.();
                        toastSuccess('Deposit verified and credited to your account.');
                    };
                    return;
                };
            } catch (e) {
                // Ignore polling errors; retry until timeout.
            };

            if (!cancelled && Date.now() - startedAt < 120000) {
                setTimeout(poll, 5000);
            };
        };

        const initialTimer = setTimeout(poll, 5000);

        return () => {
            cancelled = true;
            clearTimeout(initialTimer);
        };
    }, [status, signature, refreshUser, toastSuccess]);

    const handleAmountChange = (e) => {
        setAmount(sanitizeSolInput(e.target.value));
    };

    const handleConnect = async () => {
        setErrorMsg(null);

        try {
            setStatus(STATUS.CONNECTING);
            const key = await connect();

            if (!key) {
                throw new Error('Phantom wallet did not return a public key.');
            };

            toastSuccess('Phantom wallet connected.');
            setStatus(STATUS.IDLE);
        } catch (err) {
            const msg = isUserRejected(err) ? 'Wallet connection request was rejected.' : mapPhantomError(err);
            setStatus(STATUS.ERROR);
            setErrorMsg(msg);
            toastError(msg);
        };
    };

    const handleDisconnect = async () => {
        await disconnect();
        toastInfo('Phantom wallet disconnected.');
    };

    const handleCopySignature = async () => {
        if (!signature) return;
        const ok = await copyTextToClipboard(signature);

        if (ok) {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        };
    };

    const handleDeposit = async () => {
        if (busy) return;

        setErrorMsg(null);

        if (!depositConfig) {
            const msg = configError || 'Deposit configuration is not available. Please refresh the page.';
            setStatus(STATUS.ERROR);
            setErrorMsg(msg);
            toastError(msg);
            return;
        };

        const parsed = parseSolAmount(amount, maxDepositSol);
        if (!parsed.isValid) {
            setStatus(STATUS.ERROR);
            setErrorMsg(parsed.error);
            toastError(parsed.error);
            return;
        };

        if (!isValidSolanaAddress(depositConfig.platformAddress)) {
            const msg = 'The platform deposit address is invalid. Please contact support.';
            setStatus(STATUS.ERROR);
            setErrorMsg(msg);
            toastError(msg);
            return;
        };

        let platformPubKey;
        try {
            platformPubKey = new PublicKey(depositConfig.platformAddress);
        } catch (e) {
            const msg = 'The platform deposit address is invalid. Please contact support.';
            setStatus(STATUS.ERROR);
            setErrorMsg(msg);
            toastError(msg);
            return;
        };

        if (!/^\d{8}$/.test(depositConfig.memo || '')) {
            const msg = 'Your deposit memo is invalid. Please contact support.';
            setStatus(STATUS.ERROR);
            setErrorMsg(msg);
            toastError(msg);
            return;
        };

        const activeProvider = provider || getPhantomProvider();

        if (!activeProvider) {
            const msg = 'Phantom wallet is not installed. Please install the Phantom extension and refresh the page.';
            setStatus(STATUS.ERROR);
            setErrorMsg(msg);
            toastError(msg);
            return;
        };

        let sender = publicKey;

        if (!sender) {
            try {
                setStatus(STATUS.CONNECTING);
                sender = await connect();
            } catch (err) {
                const msg = isUserRejected(err) ? 'Wallet connection request was rejected.' : mapPhantomError(err);
                setStatus(STATUS.ERROR);
                setErrorMsg(msg);
                toastError(msg);
                return;
            };
        };

        if (!sender) {
            const msg = 'Phantom wallet is not connected. Please connect your wallet and try again.';
            setStatus(STATUS.ERROR);
            setErrorMsg(msg);
            toastError(msg);
            return;
        };

        const walletNetwork = String(activeProvider.network || activeProvider.chain || '').toLowerCase();
        const expectedNetwork = String(depositConfig.network || '').toLowerCase();

        if (walletNetwork && expectedNetwork && !walletNetwork.includes(expectedNetwork) && !expectedNetwork.includes(walletNetwork)) {
            const msg = `Your Phantom wallet appears to be on "${walletNetwork}". Please switch Phantom to ${depositConfig.network} before depositing.`;
            setStatus(STATUS.ERROR);
            setErrorMsg(msg);
            toastError(msg);
            return;
        };

        const connection = new Connection(depositConfig.rpcUrl, depositConfig.commitment || 'confirmed');
        let fromPubKey;

        try {
            fromPubKey = new PublicKey(sender);
        } catch (e) {
            const msg = 'Your connected wallet address is invalid.';
            setStatus(STATUS.ERROR);
            setErrorMsg(msg);
            toastError(msg);
            return;
        };

        try {
            const balanceLamports = BigInt(await connection.getBalance(fromPubKey, 'confirmed'));

            if (balanceLamports < parsed.lamports + FEE_BUFFER_LAMPORTS) {
                const msg = 'Insufficient SOL in your Phantom wallet to cover the deposit amount plus the network fee.';
                setStatus(STATUS.ERROR);
                setErrorMsg(msg);
                toastError(msg);
                return;
            };
        } catch (e) {
            const msg = 'Unable to verify your wallet balance via the Solana network. Please try again.';
            setStatus(STATUS.ERROR);
            setErrorMsg(msg);
            toastError(msg);
            return;
        };

        try {
            const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');

            const transaction = new Transaction();
            transaction.add(
                SystemProgram.transfer({
                    fromPubkey: fromPubKey,
                    toPubkey: platformPubKey,
                    lamports: parsed.lamports,
                }),
                new TransactionInstruction({
                    keys: [],
                    programId: new PublicKey(depositConfig.memoProgramId),
                    data: new TextEncoder().encode(depositConfig.memo),
                }),
            );
            transaction.recentBlockhash = blockhash;
            transaction.feePayer = fromPubKey;

            setStatus(STATUS.AWAITING_APPROVAL);
            const signed = await activeProvider.signTransaction(transaction);
            const signedSignature = extractSignature(signed);

            if (signedSignature) {
                setSignature(signedSignature);
            };

            setStatus(STATUS.SUBMITTING);

            let txSignature = signedSignature;

            try {
                txSignature = await connection.sendRawTransaction(signed.serialize(), {
                    skipPreflight: false,
                    preflightCommitment: depositConfig.commitment || 'confirmed',
                    maxRetries: 3,
                });
            } catch (sendErr) {
                const msg = signedSignature
                    ? 'Unable to submit the transaction to the network. Check the explorer link before retrying — do not send twice.'
                    : mapPhantomError(sendErr);
                setStatus(STATUS.ERROR);
                setErrorMsg(msg);
                toastError(msg);
                return;
            };

            setSignature(txSignature);
            setStatus(STATUS.CONFIRMING);

            const confirmation = await connection.confirmTransaction(
                { signature: txSignature, blockhash, lastValidBlockHeight },
                depositConfig.commitment || 'confirmed',
            );

            if (confirmation?.value?.err) {
                throw new Error('The transaction failed on-chain. No deposit was credited.');
            };

            setStatus(STATUS.ONCHAIN_CONFIRMED);
            toastSuccess('Transaction confirmed on Solana. Your deposit is being processed.');
        } catch (err) {
            const msg = mapPhantomError(err);
            setStatus(STATUS.ERROR);
            setErrorMsg(msg);
            toastError(msg);
        };
    };

    const statusView = getStatusView(status, errorMsg);
    const explorerUrl = signature ? getExplorerTxUrl(signature, network) : null;
    const canSubmit = !busy && !!depositConfig && !!amount;

    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <PlugZap size={18} style={{ color: '#9945FF' }} />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>Deposit with Phantom</h3>
            </div>

            {configError && (
                <div className="solana-alert-danger">
                    <AlertCircle size={18} />
                    <span>{configError}</span>
                </div>
            )}

            {!isPhantomInstalled && (
                <div className="solana-alert-danger">
                    <AlertCircle size={18} />
                    <span>
                        Phantom wallet not detected. Install the{' '}
                        <a href="https://phantom.app/download" target="_blank" rel="noreferrer" className="solana-link">
                            Phantom extension
                        </a>{' '}
                        and refresh the page.
                    </span>
                </div>
            )}

            {/* Network */}
            <div className="form-group-custom">
                <label className="solana-input-label">Network</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#e2e8f0', fontSize: '0.88rem', fontWeight: 700 }}>
                    <ShieldCheck size={16} style={{ color: '#14F195' }} />
                    <span style={{ textTransform: 'capitalize' }}>Solana {network}</span>
                </div>
            </div>

            {/* Connected wallet */}
            <div className="form-group-custom">
                <label className="solana-input-label">Connected Wallet</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input
                        type="text"
                        className="solana-input-field font-mono"
                        value={publicKey ? shortAddress(publicKey, 6, 6) : 'Not connected'}
                        style={{ paddingLeft: '1rem', fontSize: '0.82rem', background: '#07090e', color: publicKey ? '#14F195' : '#94a3b8' }}
                        readOnly
                    />
                    {publicKey ? (
                        <button
                            type="button"
                            onClick={handleDisconnect}
                            disabled={busy}
                            className="input-inline-copy"
                            title="Disconnect Phantom wallet"
                        >
                            <Unplug size={14} />
                            <span>Disconnect</span>
                        </button>
                    ) : null}
                </div>
            </div>

            {/* Amount */}
            <div className="form-group-custom">
                <label className="solana-input-label">Deposit Amount (SOL)</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <span className="font-mono" style={{ position: 'absolute', left: '1.1rem', fontWeight: 700, color: '#14F195', fontSize: '0.85rem', pointerEvents: 'none' }}>
                        SOL
                    </span>
                    <input
                        type="text"
                        inputMode="decimal"
                        autoComplete="off"
                        className="solana-input-field font-mono"
                        placeholder="Enter deposit amount"
                        value={amount}
                        onChange={handleAmountChange}
                        style={{ paddingLeft: '3.5rem' }}
                        disabled={busy}
                        aria-label="Deposit amount in SOL"
                    />
                </div>
                <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.4rem' }}>
                    Max {maxDepositSol} SOL per deposit.
                </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '0.6rem', flexDirection: 'column' }}>
                {!publicKey && (
                    <button
                        type="button"
                        onClick={handleConnect}
                        disabled={busy || !isPhantomInstalled}
                        className="solana-btn-outline"
                    >
                        {connecting ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                <span>Connecting...</span>
                            </>
                        ) : (
                            <>
                                <PlugZap size={18} />
                                <span>Connect Phantom Wallet</span>
                            </>
                        )}
                    </button>
                )}

                <button
                    type="button"
                    onClick={handleDeposit}
                    disabled={!canSubmit || !isPhantomInstalled}
                    className="solana-btn-primary"
                >
                    {busy ? (
                        <>
                            <Loader2 size={18} className="animate-spin" />
                            <span>Processing...</span>
                        </>
                    ) : (
                        <>
                            <Send size={18} />
                            <span>Deposit with Phantom</span>
                        </>
                    )}
                </button>
            </div>

            {/* Status */}
            {statusView && (
                <div
                    style={{
                        marginTop: '1rem',
                        background: 'rgba(7, 9, 14, 0.6)',
                        border: `1px solid ${statusView.color}55`,
                        borderRadius: '14px',
                        padding: '0.85rem 1rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.6rem',
                    }}
                >
                    {statusView.busy ? (
                        <Loader2 size={18} className="animate-spin" style={{ color: statusView.color, flexShrink: 0 }} />
                    ) : status === STATUS.CREDITED ? (
                        <CheckCircle2 size={18} style={{ color: statusView.color, flexShrink: 0 }} />
                    ) : status === STATUS.ERROR ? (
                        <AlertCircle size={18} style={{ color: statusView.color, flexShrink: 0 }} />
                    ) : (
                        <Info size={18} style={{ color: statusView.color, flexShrink: 0 }} />
                    )}

                    <div>
                        <div style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#64748b' }}>
                            Transaction Status
                        </div>
                        <div style={{ fontSize: '0.84rem', fontWeight: 600, color: statusView.color, lineHeight: 1.4 }}>
                            {statusView.label}
                        </div>
                    </div>
                </div>
            )}

            {/* Signature */}
            {signature && (
                <div className="form-group-custom" style={{ marginTop: '1rem', marginBottom: 0 }}>
                    <label className="solana-input-label">Transaction Signature</label>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', marginBottom: '0.6rem' }}>
                        <input
                            type="text"
                            className="solana-input-field font-mono"
                            value={signature}
                            style={{ paddingLeft: '1rem', paddingRight: '6.5rem', fontSize: '0.78rem', background: '#07090e', color: '#14F195' }}
                            readOnly
                        />
                        <button
                            type="button"
                            onClick={handleCopySignature}
                            className={`input-inline-copy${copied ? ' copied' : ''}`}
                        >
                            {copied ? <Check size={14} /> : <Copy size={14} />}
                            <span>{copied ? 'Copied' : 'Copy'}</span>
                        </button>
                    </div>

                    {explorerUrl && (
                        <a
                            href={explorerUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="solana-btn-outline"
                            style={{ textDecoration: 'none', color: '#00C2FF', borderColor: 'rgba(0,194,255,0.3)' }}
                        >
                            <ExternalLink size={16} />
                            <span>View on Solana Explorer</span>
                        </a>
                    )}

                    {signature && status !== STATUS.CREDITED && (
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.6rem', display: 'flex', gap: '0.4rem', alignItems: 'flex-start' }}>
                            <Wallet size={14} style={{ marginTop: '1px', flexShrink: 0 }} />
                            <span>
                                You can safely check the explorer link above to monitor this transaction. Do not resend the
                                same deposit while it is pending.
                            </span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};