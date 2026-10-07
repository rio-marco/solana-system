const { v4: uuidv4 } = require('uuid');
const constants = require('../../../../lib/constants');
const messages = require('../../../../lib/messages');
const { verifySession } = require('../../../../lib/session');
const { validateMemo, validateAmount, isValidSolanaAddress } = require('../../../../lib/validation');
const { executeWithdrawalTransaction } = require('../../../../lib/services/solana.service');
const { errorResponse, successResponse, authErrorResponse, log1 } = require("../../../../lib/general");
const { emitToUser } = require('../../../../lib/socket');
const Withdrawal = require('../../../../lib/models/withdrawal.model');
const User = require('../../../../lib/models/user.model');
const Notification = require('../../../../lib/models/notification.model');

async function POST(req) {
    try {
        const sessionAuth = await verifySession(req);
        if (!sessionAuth || !sessionAuth.user) {
            return authErrorResponse(messages.unauthorizedAccess);
        };

        const user = sessionAuth.user;
        const body = await req.json();
        const { toAddress, amount, memo } = body;

        if (!toAddress || !isValidSolanaAddress(toAddress.trim())) {
            return errorResponse("Invalid or missing recipient Solana wallet address.");
        };

        const memoVal = validateMemo(memo || user.memo);
        if (!memoVal.isValid) {
            return errorResponse(memoVal.error);
        };

        const amountVal = validateAmount(amount);
        if (!amountVal.isValid) {
            return errorResponse(amountVal.error);
        };

        const freshUser = await User.findById(user._id).lean();
        if (!freshUser || (freshUser.walletBalance || 0) < amountVal.numericAmount) {
            const avail = freshUser ? freshUser.walletBalance : 0;
            return errorResponse(`Insufficient account balance. Available: ${avail} SOL, Requested: ${amountVal.numericAmount} SOL.`);
        };

        const withdrawId = `WTH-${uuidv4().substring(0, 8).toUpperCase()}`;

        const withdrawal = new Withdrawal({
            userId: user._id,
            withdrawId,
            toAddress: toAddress.trim(),
            memo: memoVal.cleanMemo,
            amount: amountVal.numericAmount,
            currency: 'SOL',
            status: 'PENDING',
        });
        await withdrawal.save();

        let txResult;
        try {
            withdrawal.status = 'PROCESSING';
            await withdrawal.save();

            txResult = await executeWithdrawalTransaction({
                toAddress: toAddress.trim(),
                memo: memoVal.cleanMemo,
                amount: amountVal.numericAmount,
            });

            withdrawal.transactionSignature = txResult.signature;
            withdrawal.fromAddress = txResult.fromAddress;
            withdrawal.status = 'CONFIRMED';
            withdrawal.confirmedAt = new Date();
            await withdrawal.save();
        } catch (txErr) {
            withdrawal.status = 'FAILED';
            withdrawal.failureReason = txErr.message;
            await withdrawal.save();

            log1(["Withdrawal execution failed:", txErr.message]);
            return errorResponse("Withdrawal execution failed");
        };

        const updatedUser = await User.findByIdAndUpdate(
            user._id,
            { $inc: { walletBalance: -amountVal.numericAmount } },
            { new: true }
        );

        const newNotif = await Notification.create({
            userId: user._id,
            title: 'Withdrawal Executed',
            message: `Withdrawal of ${amountVal.numericAmount} SOL to ${toAddress.trim().slice(0, 8)}... confirmed on-chain!`,
            type: 'WITHDRAWAL',
            amount: amountVal.numericAmount,
            transactionSignature: txResult.signature,
            isRead: false,
        });

        emitToUser(user._id, 'newNotification', newNotif);
        emitToUser(user._id, 'withdrawal_confirmed', {
            withdrawId: withdrawal.withdrawId,
            amount: amountVal.numericAmount,
            signature: txResult.signature,
        });

        return successResponse(
            `Successfully withdrew ${amountVal.numericAmount} SOL!`,
            {
                withdrawId: withdrawal.withdrawId,
                amount: withdrawal.amount,
                signature: withdrawal.transactionSignature,
                status: withdrawal.status,
                updatedWalletBalance: updatedUser.walletBalance,
                explorerUrl: `https://explorer.solana.com/tx/${withdrawal.transactionSignature}?cluster=devnet`,
            },
        );
    } catch (err) {
        log1(['Error in withdraw/create API route:', err.message]);
        return errorResponse(messages.unexpectedDataError);
    };
};

module.exports = { POST };