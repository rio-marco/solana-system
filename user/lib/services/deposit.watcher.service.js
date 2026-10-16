'use strict';

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
const MAX_DEPOSIT_SOL = 10000;

const CURSOR_SETTING_KEY = 'DEPOSIT_WATCHER_CURSOR';

const scannedSignatures = new Set();
let timer = null;
let isScanning = false;

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
                return Buffer.from(bs58.decode(inst.data)).toString('utf-8');
            } catch (e) {
                try {
                    return Buffer.from(inst.data, 'base64').toString('utf-8');
                } catch (e2) {
                    continue;
                };
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

const creditDeposit = async ({ user, lamports, fromAddress, platformAddress, signature, memo, slot, blockTime }) => {
    const amountSol = lamportsToSol(lamports);
    const txId = `DEP-${uuidv4().toUpperCase()}`;

    const transaction = new Transaction({
        userId: user._id,
        txId,
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

    await transaction.save();

    const updatedUser = await User.findByIdAndUpdate(
        user._id,
        {
            $inc: {
                solBalance: amountSol,
                btcrBalance: amountSol,
            },
        },
        { new: true }
    );

    if (!updatedUser) {
        transaction.status = constants.TRANSACTION_STATUS.FAILED;
        transaction.failureReason = 'User not found while crediting deposit.';
        await transaction.save();
        log1(['[Deposit Watcher] User not found while crediting:', user._id]);
        return;
    };

    const newNotif = await Notification.create({
        userId: user._id,
        title: 'Deposit Confirmed',
        message: `Your deposit of ${amountSol} SOL has been verified & confirmed on Solana!`,
        type: 'DEPOSIT',
        amount: amountSol,
        transactionSignature: signature,
        isRead: false,
    });

    emitToUser(user._id, 'newNotification', newNotif);
    emitToUser(user._id, 'deposit_confirmed', {
        txId,
        amount: amountSol,
        signature,
    });

    log1([`[Deposit Watcher] Credited ${amountSol} SOL to ${user.email} (memo ${memo}) from tx ${signature}`]);
};

const processSignature = async (sigInfo, platformAddress) => {
    const signature = sigInfo.signature;
    const scanKey = `${platformAddress}:${signature}`;

    if (scannedSignatures.has(scanKey)) return;

    if (sigInfo.err) {
        scannedSignatures.add(scanKey);
        return;
    };

    const existing = await Transaction.findOne({
        transactionSignature: signature,
        type: constants.TRX_TYPE.CREDIT,
    });

    if (existing) {
        scannedSignatures.add(scanKey);
        return;
    };

    let tx;
    try {
        tx = await connection.getParsedTransaction(signature, {
            maxSupportedTransactionVersion: 0,
            commitment: process.env.SOLANA_COMMITMENT || 'confirmed',
        });
    } catch (err) {
        log1(['[Deposit Watcher] RPC error fetching transaction:', signature, err.message]);
        return;
    };

    if (!tx || (tx.meta && tx.meta.err !== null)) {
        scannedSignatures.add(scanKey);
        return;
    };

    const transfer = extractIncomingTransfer(tx, platformAddress);
    if (!transfer) {
        scannedSignatures.add(scanKey);
        return;
    };

    const allInstructions = [
        ...(tx.transaction.message.instructions || []),
        ...(tx.meta?.innerInstructions?.flatMap((i) => i.instructions) || []),
    ];

    const rawMemo = extractMemoText(allInstructions);
    const cleanMemo = rawMemo ? String(rawMemo).trim() : '';

    if (!/^\d{8}$/.test(cleanMemo)) {
        scannedSignatures.add(scanKey);
        log1([`[Deposit Watcher] Skipped tx ${signature}: no valid 8-digit user memo found (memo: "${cleanMemo || 'none'}")`]);
        return;
    };

    const user = await User.findOne({ memo: cleanMemo });
    if (!user) {
        scannedSignatures.add(scanKey);
        log1([`[Deposit Watcher] Skipped tx ${signature}: no user matches memo ${cleanMemo}`]);
        return;
    };

    const amountSol = lamportsToSol(transfer.lamports);
    if (amountSol <= 0 || amountSol > MAX_DEPOSIT_SOL) {
        scannedSignatures.add(scanKey);
        log1([`[Deposit Watcher] Skipped tx ${signature}: amount ${amountSol} SOL out of allowed range`]);
        return;
    };

    try {
        await creditDeposit({
            user,
            lamports: transfer.lamports,
            fromAddress: transfer.fromAddress,
            platformAddress,
            signature,
            memo: cleanMemo,
            slot: tx.slot,
            blockTime: tx.blockTime ? new Date(tx.blockTime * 1000) : new Date(),
        });
    } catch (err) {
        log1(['[Deposit Watcher] Failed to record deposit for tx', signature, err.message]);
        return;
    };

    scannedSignatures.add(scanKey);
};

const scanOnce = async () => {
    if (isScanning) return;
    isScanning = true;

    try {
        const pubKey = await getPlatformReceivingAddress(false);
        if (!pubKey) return;

        const platformAddress = pubKey.toBase58();

        const sigInfos = await connection.getSignaturesForAddress(pubKey, {
            limit: SIGNATURE_SCAN_LIMIT,
        });

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

        for (const sigInfo of batch) {
            try {
                await processSignature(sigInfo, platformAddress);
            } catch (err) {
                log1(['[Deposit Watcher] Error processing signature', sigInfo.signature, err.message]);
            };
        };

        await saveCursor(platformAddress, sigInfos[0].signature);
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