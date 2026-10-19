'use strict';

const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const bs58 = require('bs58');

const constants = require('../constants');
const { connection, MEMO_PROGRAM_ID } = require('../solana');
const { lamportsToSol } = require('../validation');
const { log1 } = require('../general');
const { emitToUser } = require('../socket');
const Transaction = require('../models/transaction.model');
const User = require('../models/user.model');
const Notification = require('../models/notification.model');
const Setting = require('../models/setting.model');
const { getPlatformReceivingAddress } = require('./solana.service');

const POLL_INTERVAL_MS = parseInt(process.env.DEPOSIT_WATCHER_INTERVAL_MS || '30000', 10);
const SIGNATURE_SCAN_LIMIT = parseInt(process.env.DEPOSIT_WATCHER_SCAN_LIMIT || '200', 10);
const INITIAL_CATCHUP_LIMIT = parseInt(process.env.DEPOSIT_WATCHER_CATCHUP_LIMIT || '50', 10);
const MAX_PROCESS_RETRIES = parseInt(process.env.DEPOSIT_WATCHER_MAX_RETRIES || '5', 10);
const RPC_MAX_RETRIES = parseInt(process.env.DEPOSIT_WATCHER_RPC_RETRIES || '4', 10);
const RPC_BASE_DELAY_MS = parseInt(process.env.DEPOSIT_WATCHER_RPC_BASE_DELAY_MS || '400', 10);

const MAX_DEPOSIT_SOL = constants.MAX_DEPOSIT_SOL;

const CURSOR_SETTING_KEY = 'DEPOSIT_WATCHER_CURSOR';

const scannedSignatures = new Set();
const pendingAttempts = new Map();
let timer = null;
let isScanning = false;
let transactionsSupported = true;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const withRpcRetry = async (fn, label = 'rpc') => {
    let attempt = 0;

    while (true) {
        try {
            return await fn();
        } catch (err) {
            if (attempt >= RPC_MAX_RETRIES) {
                throw err;
            };

            const jitter = Math.floor(Math.random() * 250);
            const delay = RPC_BASE_DELAY_MS * Math.pow(2, attempt) + jitter;

            log1([`[Deposit Watcher] RPC ${label} failed (attempt ${attempt + 1}), retrying in ${delay}ms:`, err.message]);
            await sleep(delay);
            attempt++;
        };
    };
};

const isDuplicateKeyError = (err) =>
    !!err && (err.code === 11000 || err.codeName === 'DuplicateKey' || /E11000/.test(String(err.message)));

const isTransactionUnsupportedError = (err) => {
    const message = String(err?.message || '');
    return (
        err?.code === 20 ||
        err?.codeName === 'IllegalOperation' ||
        /Transaction numbers are only allowed|replica set member or mongos|does not support transactions/i.test(message)
    );
};

const getCursorMap = async () => {
    try {
        const raw = await Setting.getVal(CURSOR_SETTING_KEY, '{}');
        const parsed = JSON.parse(raw || '{}');
        return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (e) {
        return {};
    };
};

const saveCursor = async (addressStr, signature) => {
    try {
        const map = await getCursorMap();
        map[addressStr] = signature;
        await Setting.setVal(CURSOR_SETTING_KEY, JSON.stringify(map), 'Last scanned signature per platform address for deposit watcher');
    } catch (e) {
        log1(['[Deposit Watcher] Failed to persist cursor:', e.message]);
    };
};

const extractMemoText = (instructions) => {
    for (const inst of instructions) {
        const programIdStr = inst.programId
            ? (typeof inst.programId === 'string' ? inst.programId : inst.programId.toBase58())
            : '';

        const isMemoProgram = programIdStr === MEMO_PROGRAM_ID.toBase58() || inst.program === 'spl-memo';
        if (!isMemoProgram) continue;

        if (typeof inst.parsed === 'string' && inst.parsed) {
            return inst.parsed;
        };

        if (inst.parsed && typeof inst.parsed.memo === 'string' && inst.parsed.memo) {
            return inst.parsed.memo;
        };

        if (inst.data) {
            try {
                return Buffer.from(bs58.decode(inst.data)).toString('utf8');
            } catch (err) {
                log1(['[Deposit Watcher] Failed to decode memo instruction:', err.message]);
            };
        };
    };

    return null;
};

const extractIncomingTransfer = (tx, platformAddress) => {
    const allInstructions = [
        ...(tx.transaction.message.instructions || []),
        ...(tx.meta?.innerInstructions?.flatMap((i) => i.instructions) || []),
    ];

    let totalLamports = BigInt(0);
    let fromAddress = '';

    for (const inst of allInstructions) {
        if (inst.program !== 'system' || !inst.parsed || !inst.parsed.info) continue;

        const type = inst.parsed.type;
        if (type !== 'transfer' && type !== 'transferChecked') continue;

        const info = inst.parsed.info;
        if (info.destination !== platformAddress) continue;

        if (info.source === platformAddress) continue;

        const lamports = BigInt(info.lamports || 0);
        if (lamports > BigInt(0)) {
            totalLamports += lamports;
            if (!fromAddress) fromAddress = info.source;
        };
    };

    if (totalLamports === BigInt(0)) {
        const accountKeys = tx.transaction.message.accountKeys.map((acc) =>
            typeof acc === 'string' ? acc : acc.pubkey.toBase58()
        );
        const recipientIndex = accountKeys.indexOf(platformAddress);

        if (recipientIndex !== -1 && tx.meta?.preBalances && tx.meta?.postBalances) {
            const preBal = BigInt(tx.meta.preBalances[recipientIndex] || 0);
            const postBal = BigInt(tx.meta.postBalances[recipientIndex] || 0);
            const netDifference = postBal - preBal;

            if (netDifference > BigInt(0)) {
                totalLamports = netDifference;
                const feePayer = accountKeys[0];
                if (feePayer && feePayer !== platformAddress) fromAddress = feePayer;
            };
        };
    };

    if (totalLamports <= BigInt(0)) return null;

    return { lamports: totalLamports, fromAddress };
};

const buildDepositDoc = ({ user, amountSol, fromAddress, platformAddress, signature, memo, slot, blockTime }) => ({
    userId: user._id,
    txId: `DEP-${uuidv4().toUpperCase()}`,
    type: constants.TRX_TYPE.CREDIT,
    coin: constants.COIN.BTCR,
    memo: {
        id: memo,
        coin: constants.COIN.SOL,
        amount: amountSol,
        date: new Date(),
        trx_id: signature,
    },
    amount: amountSol,
    platformAddress,
    fromAddress: fromAddress || '',
    toAddress: platformAddress,
    transactionSignature: signature,
    status: constants.TRANSACTION_STATUS.CONFIRMED,
    submittedAt: blockTime || new Date(),
    confirmedAt: new Date(),
    slot: slot || null,
    blockTime: blockTime || null,
});

const runCreditingTransaction = async (depositDoc, userId, amountSol) => {
    const session = await mongoose.startSession();

    try {
        await session.withTransaction(async () => {
            await Transaction.create([depositDoc], { session });

            const updateResult = await User.updateOne(
                { _id: userId },
                { $inc: { solBalance: amountSol, btcrBalance: amountSol } },
                { session },
            );

            if (!updateResult || updateResult.matchedCount === 0) {
                throw new Error('USER_NOT_FOUND');
            };
        });
    } finally {
        await session.endSession();
    };
};

const creditDepositFallback = async (depositDoc, userId, amountSol) => {
    let created;

    try {
        created = await Transaction.create(depositDoc);
    } catch (err) {
        if (isDuplicateKeyError(err)) return 'duplicate';
        throw err;
    };

    const updateResult = await User.updateOne(
        { _id: userId },
        { $inc: { solBalance: amountSol, btcrBalance: amountSol } },
    );

    if (!updateResult || updateResult.matchedCount === 0) {
        await Transaction.deleteOne({ _id: created._id });
        return 'failed';
    };

    return 'credited';
};

const creditDeposit = async (params) => {
    const amountSol = lamportsToSol(params.lamports);
    const depositDoc = buildDepositDoc({ ...params, amountSol });

    let outcome = 'failed';

    try {
        if (transactionsSupported) {
            await runCreditingTransaction(depositDoc, params.user._id, amountSol);
            outcome = 'credited';
        } else {
            outcome = await creditDepositFallback(depositDoc, params.user._id, amountSol);
        };
    } catch (err) {
        if (isDuplicateKeyError(err)) {
            return { status: 'duplicate' };
        };

        if (isTransactionUnsupportedError(err)) {
            transactionsSupported = false;
            log1(['[Deposit Watcher] MongoDB deployment does not support transactions; using fallback crediting path.']);
            outcome = await creditDepositFallback(depositDoc, params.user._id, amountSol);

            if (outcome === 'duplicate') return { status: 'duplicate' };
        } else {
            throw err;
        };
    };

    if (outcome !== 'credited') {
        return { status: outcome };
    };

    try {
        const newNotif = await Notification.create({
            userId: params.user._id,
            title: 'Deposit Confirmed',
            message: `Your deposit of ${amountSol} SOL has been verified & confirmed on Solana!`,
            type: 'DEPOSIT',
            amount: amountSol,
            transactionSignature: params.signature,
            isRead: false,
        });

        emitToUser(params.user._id, 'newNotification', newNotif);
        emitToUser(params.user._id, 'deposit_confirmed', {
            txId: depositDoc.txId,
            amount: amountSol,
            signature: params.signature,
        });
    } catch (err) {
        log1(['[Deposit Watcher] Deposit credited but notification failed:', err.message]);
    };

    log1([`[Deposit Watcher] Credited ${amountSol} SOL to ${params.user.email} (memo ${params.memo}) from tx ${params.signature}`]);

    return { status: 'credited' };
};

const processSignature = async (sigInfo, platformAddress) => {
    const signature = sigInfo.signature;
    const scanKey = `${platformAddress}:${signature}`;

    if (scannedSignatures.has(scanKey)) return 'processed';

    if (sigInfo.err) {
        scannedSignatures.add(scanKey);
        return 'processed';
    };

    const existing = await Transaction.findOne({
        transactionSignature: signature,
        type: constants.TRX_TYPE.CREDIT,
    });

    if (existing) {
        scannedSignatures.add(scanKey);
        return 'processed';
    };

    let tx;

    try {
        tx = await withRpcRetry(
            () => connection.getParsedTransaction(signature, {
                maxSupportedTransactionVersion: 0,
                commitment: process.env.SOLANA_COMMITMENT || 'confirmed',
            }),
            `getParsedTransaction(${signature.slice(0, 8)})`,
        );
    } catch (err) {
        return registerRetry(scanKey, `RPC error fetching transaction ${signature}: ${err.message}`);
    };

    log1(["tx process response object---------------------->", JSON.stringify(tx)]);

    if (!tx) {
        return registerRetry(scanKey, `Transaction ${signature} not yet indexed by RPC`);
    };

    if (tx.meta && tx.meta.err !== null) {
        scannedSignatures.add(scanKey);
        return 'processed';
    };

    const transfer = extractIncomingTransfer(tx, platformAddress);
    if (!transfer) {
        scannedSignatures.add(scanKey);
        return 'processed';
    };

    const allInstructions = [
        ...(tx.transaction.message.instructions || []),
        ...(tx.meta?.innerInstructions?.flatMap((i) => i.instructions) || []),
    ];

    const rawMemo = extractMemoText(allInstructions);
    const cleanMemo = rawMemo ? String(rawMemo).trim() : '';

    log1([`[Deposit Watcher] Extracted memo for ${signature}:`, cleanMemo || 'NONE']);

    if (!/^\d{8}$/.test(cleanMemo)) {
        scannedSignatures.add(scanKey);
        log1([`[Deposit Watcher] Skipped tx ${signature}: no valid 8-digit user memo found (memo: "${cleanMemo || 'none'}")`]);
        return 'processed';
    };

    const user = await User.findOne({ memo: cleanMemo });
    if (!user) {
        scannedSignatures.add(scanKey);
        log1([`[Deposit Watcher] Skipped tx ${signature}: no user matches memo ${cleanMemo}`]);
        return 'processed';
    };

    const amountSol = lamportsToSol(transfer.lamports);
    if (amountSol <= 0 || amountSol > MAX_DEPOSIT_SOL) {
        scannedSignatures.add(scanKey);
        log1([`[Deposit Watcher] Skipped tx ${signature}: amount ${amountSol} SOL out of allowed range`]);
        return 'processed';
    };

    try {
        const result = await creditDeposit({
            user,
            lamports: transfer.lamports,
            fromAddress: transfer.fromAddress,
            platformAddress,
            signature,
            memo: cleanMemo,
            slot: tx.slot,
            blockTime: tx.blockTime ? new Date(tx.blockTime * 1000) : new Date(),
        });

        if (result.status === 'duplicate') {
            scannedSignatures.add(scanKey);
            pendingAttempts.delete(scanKey);
            return 'processed';
        };

        if (result.status !== 'credited') {
            return registerRetry(scanKey, `Crediting returned status "${result.status}" for ${signature}`);
        };

        scannedSignatures.add(scanKey);
        pendingAttempts.delete(scanKey);
        return 'processed';
    } catch (err) {
        return registerRetry(scanKey, `Failed to record deposit for tx ${signature}: ${err.message}`);
    };
};

const registerRetry = (scanKey, message) => {
    const attempts = (pendingAttempts.get(scanKey) || 0) + 1;

    if (attempts > MAX_PROCESS_RETRIES) {
        pendingAttempts.delete(scanKey);
        scannedSignatures.add(scanKey);
        log1([`[Deposit Watcher] Giving up after ${MAX_PROCESS_RETRIES} attempts: ${message}`]);
        return 'processed';
    };

    pendingAttempts.set(scanKey, attempts);
    log1([`[Deposit Watcher] Retry ${attempts}/${MAX_PROCESS_RETRIES} scheduled: ${message}`]);
    return 'retry';
};

const scanOnce = async () => {
    if (isScanning) return;
    isScanning = true;

    try {
        const pubKey = await getPlatformReceivingAddress(false);
        if (!pubKey) return;

        const platformAddress = pubKey.toBase58();

        const sigInfos = await withRpcRetry(
            () => connection.getSignaturesForAddress(pubKey, { limit: SIGNATURE_SCAN_LIMIT }),
            'getSignaturesForAddress',
        );

        if (!sigInfos || sigInfos.length === 0) return;

        const cursorMap = await getCursorMap();
        const cursor = cursorMap[platformAddress];

        let batch;
        if (cursor) {
            const cursorIndex = sigInfos.findIndex((s) => s.signature === cursor);
            batch = cursorIndex === -1
                ? sigInfos.slice(0, INITIAL_CATCHUP_LIMIT)
                : sigInfos.slice(0, cursorIndex);
        } else {
            batch = sigInfos.slice(0, INITIAL_CATCHUP_LIMIT);
        };

        batch.reverse();

        let lastProcessed = null;
        let aborted = false;

        for (const sigInfo of batch) {
            let outcome;

            try {
                outcome = await processSignature(sigInfo, platformAddress);
            } catch (err) {
                outcome = registerRetry(`${platformAddress}:${sigInfo.signature}`, `Unexpected error for ${sigInfo.signature}: ${err.message}`);
            };

            if (outcome === 'retry') {
                aborted = true;
                break;
            };

            lastProcessed = sigInfo.signature;
        };

        if (aborted) {
            if (lastProcessed) {
                await saveCursor(platformAddress, lastProcessed);
            };
        } else {
            await saveCursor(platformAddress, sigInfos[0].signature);
        };
    } catch (err) {
        log1(['[Deposit Watcher] Scan failed:', err.message]);
    } finally {
        isScanning = false;
    };
};

const startDepositWatcher = () => {
    if (timer) return;

    log1([`[Deposit Watcher] Starting (interval ${POLL_INTERVAL_MS}ms, scan ${SIGNATURE_SCAN_LIMIT} sigs/tick)`]);

    scanOnce();
    timer = setInterval(scanOnce, POLL_INTERVAL_MS);
    if (timer.unref) timer.unref();
};

const stopDepositWatcher = () => {
    if (timer) {
        clearInterval(timer);
        timer = null;
    };
};

module.exports = {
    startDepositWatcher,
    stopDepositWatcher,
    scanOnce,
};