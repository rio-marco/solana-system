const { PublicKey } = require('@solana/web3.js');
const { v4: uuidv4 } = require('uuid');
const constants = require("../config/constant");
const Generallib = require('../utils/lib/general.lib');
const messages = require('../utils/messages');
const { validateMemo, validateAmount } = require('../utils/validation');
const { executeWithdrawalTransaction } = require('../services/solana.service');
const Withdrawal = require('../models/withdrawal.model');
const User = require('../models/user.model');
const Notification = require('../models/notification.model');

const createWithdrawal = async (req, res, next) => {
    try {
        const { toAddress, memo, amount } = req.body;

        if (!toAddress || typeof toAddress !== 'string' || !toAddress.trim()) {
            return res.status(constants.STATUS.BAD_REQUEST).json(Generallib.error_res("Target Solana 'To Address' is required."));
        };

        try {
            new PublicKey(toAddress.trim());
        } catch (err) {
            return res.status(constants.STATUS.BAD_REQUEST).json(Generallib.error_res("Invalid Solana public key in 'To Address'."));
        };

        const memoVal = validateMemo(memo);
        if (!memoVal.isValid) {
            return res.status(constants.STATUS.BAD_REQUEST).json(Generallib.error_res(memoVal.error));
        };

        const amountVal = validateAmount(amount);
        if (!amountVal.isValid) {
            return res.status(constants.STATUS.BAD_REQUEST).json(Generallib.error_res(amountVal.error));
        };

        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(constants.STATUS.BAD_REQUEST).json(Generallib.error_res("User session not found."));
        };

        const currentBalance = user.walletBalance || 0;
        if (amountVal.numericAmount > currentBalance) {
            return res.status(constants.STATUS.BAD_REQUEST).json(Generallib.error_res(`Insufficient wallet balance. Maximum withdrawable balance is ${currentBalance.toFixed(6)} SOL.`));
        };

        const withdrawId = `WITH-${uuidv4().substring(0, 8).toUpperCase()}`;

        const withdrawal = new Withdrawal({
            userId: user._id,
            withdrawId,
            toAddress: toAddress.trim(),
            memo: memoVal.cleanMemo,
            amount: amountVal.numericAmount,
            status: 'PENDING',
        });

        await withdrawal.save();

        try {
            const txResult = await executeWithdrawalTransaction({
                toAddress: toAddress.trim(),
                memo: memoVal.cleanMemo,
                amount: amountVal.numericAmount,
            });

            withdrawal.transactionSignature = txResult.signature;
            withdrawal.fromAddress = txResult.fromAddress;
            withdrawal.status = 'CONFIRMED';
            withdrawal.confirmedAt = new Date();

            await withdrawal.save();

            // Deduct amount from user wallet balance
            user.walletBalance = Math.max(0, user.walletBalance - withdrawal.amount);
            await user.save();

            // Create notification record
            const notification = await Notification.create({
                userId: user._id,
                title: 'Withdrawal Successful!',
                message: `Successfully withdrew ${withdrawal.amount} SOL to ${withdrawal.toAddress}.`,
                type: 'WITHDRAWAL',
                amount: withdrawal.amount,
                transactionSignature: withdrawal.transactionSignature,
            });

            // Emit real-time notification via Socket.io
            const io = req.app.get('io');
            if (io) {
                io.to(`user_${user._id}`).emit('notification', {
                    notification,
                    newBalance: user.walletBalance,
                });
            };

            const responsePayload = {
                withdrawId: withdrawal.withdrawId,
                signature: withdrawal.transactionSignature,
                fromAddress: withdrawal.fromAddress,
                toAddress: withdrawal.toAddress,
                status: withdrawal.status,
                amount: withdrawal.amount,
                memo: withdrawal.memo,
                confirmedAt: withdrawal.confirmedAt,
                createdAt: withdrawal.createdAt,
                updatedWalletBalance: user.walletBalance,
            };

            return res.status(constants.STATUS.OK).json(Generallib.success_res("Withdrawal completed successfully on Solana blockchain!", responsePayload));
        } catch (txErr) {
            withdrawal.status = 'FAILED';
            withdrawal.failureReason = txErr.message;
            await withdrawal.save();

            Generallib.log1(["createWithdrawal Error----------->", txErr.message]);
            return res.status(constants.STATUS.BAD_REQUEST).json(Generallib.error_res("Solana withdrawal transaction failed"));
        };
    } catch (err) {
        Generallib.log1(["createWithdrawal Error Message----------->", err.message]);
        return res.status(constants.STATUS.INTERNAL_SERVER_ERROR).json(Generallib.error_res(messages.unexpectedDataError));
    };
};

const getWithdrawals = async (req, res, next) => {
    try {
        const userId = req.user ? req.user._id : null;
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.max(1, parseInt(req.query.limit) || 10);
        const skip = (page - 1) * limit;

        const query = userId ? { userId } : {};

        const [withdrawals, total] = await Promise.all([
            Withdrawal.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Withdrawal.countDocuments(query),
        ]);

        const totalPages = Math.ceil(total / limit) || 1;

        const responsePayload = {
            withdrawals,
            pagination: {
                total,
                page,
                limit,
                totalPages,
            },
        };

        return res.status(constants.STATUS.OK).json(Generallib.success_res("Withdrawal list get successfully!", responsePayload));
    } catch (err) {
        Generallib.log1(["getWithdrawals Error----------->", err.message]);
        return res.status(constants.STATUS.INTERNAL_SERVER_ERROR).json(Generallib.error_res(messages.unexpectedDataError));
    };
};

module.exports = {
    createWithdrawal,
    getWithdrawals,
};