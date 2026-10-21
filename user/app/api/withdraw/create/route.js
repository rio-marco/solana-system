const { v4: uuidv4 } = require('uuid');
const constants = require('../../../../lib/constants');
const messages = require('../../../../lib/messages');
const { verifySession } = require('../../../../lib/session');
const { validateMemo, validateAmount, isValidSolanaAddress } = require('../../../../lib/validation');
const { executeWithdrawalTransaction, getPlatformReceivingAddress } = require('../../../../lib/services/solana.service');
const { errorResponse, successResponse, authErrorResponse, log1 } = require("../../../../lib/general");
const { emitToUser } = require('../../../../lib/socket');
const Transaction = require('../../../../lib/models/transaction.model');
const User = require('../../../../lib/models/user.model');
const Notification = require('../../../../lib/models/notification.model');
const Setting = require('../../../../lib/models/setting.model');

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

        const userdetails = await User.findById(user._id).lean();
        if (!userdetails || (userdetails.availableWithdrawBalance || 0) < amountVal.numericAmount) {
            const avail = userdetails ? userdetails.availableWithdrawBalance : 0;
            return errorResponse(`Insufficient account balance. Available: ${avail} BTCR, Requested: ${amountVal.numericAmount} BTCR.`);
        };

        if (!userdetails || (userdetails.btcrBalance || 0) < amountVal.numericAmount) {
            const avail = userdetails ? userdetails.btcrBalance : 0;
            return errorResponse(`Insufficient account balance. Available: ${avail} BTCR, Requested: ${amountVal.numericAmount} BTCR.`);
        };

        const withdrawFee = (await Setting.getVal('WITHDRAWAL_PLATFORM_FEE'));

        const totalWithdrawAmount = amountVal.numericAmount - Number(withdrawFee);

        if (totalWithdrawAmount <= 0) {
            return errorResponse("Invalid withdraw amount. Please enter valid amount.");
        };

        const txId = `WTH-${uuidv4().substring(0, 8).toUpperCase()}`;

        const platformPubKey = await getPlatformReceivingAddress(true);
        const platformAddressStr = platformPubKey ? platformPubKey.toBase58() : '';

        const transaction = await Transaction.create({
            userId: user._id,
            txId,
            type: constants.TRX_TYPE.DEBIT,
            coin: constants.COIN.BTCR,
            memo: {
                id: memoVal.cleanMemo,
                coin: constants.COIN.BTCR,
                amount: amountVal.numericAmount,
                date: new Date(),
                trx_id: "",
            },
            amount: amountVal.numericAmount,
            description: `${amountVal.numericAmount} BTCR deducted for withdrawal.`,
            platformAddress: platformAddressStr,
            toAddress: toAddress.trim(),
            platformFee: Number(withdrawFee),
            status: constants.TRANSACTION_STATUS.PENDING,
            submittedAt: new Date(),
        });

        let txResult;
        try {
            transaction.status = constants.TRANSACTION_STATUS.PROCESSING;
            await transaction.save();

            txResult = await executeWithdrawalTransaction({
                toAddress: toAddress.trim(),
                memo: memoVal.cleanMemo,
                amount: totalWithdrawAmount,
            });

            transaction.transactionSignature = txResult.signature;
            transaction.memo.trx_id = txResult.signature;
            transaction.fromAddress = txResult.fromAddress;
            transaction.status = constants.TRANSACTION_STATUS.CONFIRMED;
            transaction.confirmedAt = new Date();
            await transaction.save();
        } catch (txErr) {
            transaction.status = constants.TRANSACTION_STATUS.FAILED;
            transaction.failureReason = txErr.message;
            await transaction.save();

            log1(["Withdrawal execution failed:", txErr.message]);
            return errorResponse("Withdrawal execution failed");
        };

        const updatedUser = await User.findByIdAndUpdate(
            user._id,
            {
                $inc: {
                    btcrBalance: -amountVal.numericAmount,
                    availableWithdrawBalance: -amountVal.numericAmount,
                },
            },
            { new: true }
        );

        const newNotif = await Notification.create({
            userId: user._id,
            title: 'Withdrawal Executed',
            message: `Withdrawal of ${amountVal.numericAmount} BTCR to ${toAddress.trim().slice(0, 8)}... confirmed on-chain!`,
            type: 'WITHDRAWAL',
            amount: amountVal.numericAmount,
            transactionSignature: txResult.signature,
            isRead: false,
        });

        emitToUser(user._id, 'newNotification', newNotif);
        emitToUser(user._id, 'withdrawal_confirmed', {
            txId: transaction.txId,
            amount: amountVal.numericAmount,
            signature: txResult.signature,
        });

        return successResponse(
            `Successfully withdrew ${amountVal.numericAmount} BTCR!`,
            {
                txId: transaction.txId,
                amount: transaction.amount,
                signature: transaction.transactionSignature,
                status: transaction.status,
                btcrBalance: updatedUser.btcrBalance,
                availableWithdrawBalance: updatedUser.availableWithdrawBalance,
                explorerUrl: `https://explorer.solana.com/tx/${transaction.transactionSignature}?cluster=devnet`,
            },
        );
    } catch (err) {
        log1(['Error in withdraw/create API route:', err.message]);
        return errorResponse(messages.unexpectedDataError);
    };
};

module.exports = { POST };