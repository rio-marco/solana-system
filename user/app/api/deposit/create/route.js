const { v4: uuidv4 } = require('uuid');
const constants = require('../../../../lib/constants');
const messages = require('../../../../lib/messages');
const { verifySession } = require('../../../../lib/session');
const { validateMemo, validateAmount } = require('../../../../lib/validation');
const { getPlatformReceivingAddress, executeDepositTransaction } = require('../../../../lib/services/solana.service');
const { verifyDepositTransaction } = require('../../../../lib/services/verification.service');
const { emitToUser } = require('../../../../lib/socket');
const { errorResponse, successResponse, authErrorResponse, log1 } = require("../../../../lib/general");
const Transaction = require('../../../../lib/models/transaction.model');
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
        const { memo, amount } = body;

        const memoVal = validateMemo(memo || user.memo);
        if (!memoVal.isValid) {
            return errorResponse(memoVal.error);
        };

        const amountVal = validateAmount(amount);
        if (!amountVal.isValid) {
            return errorResponse(amountVal.error);
        };

        const platformPubKey = await getPlatformReceivingAddress(true);
        const platformAddressStr = platformPubKey.toBase58();

        // const txId = `DEP-${uuidv4().substring(0, 8).toUpperCase()}`;
        const txId = `DEP-${uuidv4().toUpperCase()}`;

        const transaction = new Transaction({
            userId: user._id,
            txId,
            type: constants.TRX_TYPE.CREDIT,
            coin: constants.COIN.BTCR,
            memo: {
                id: memoVal.cleanMemo,
                coin: constants.COIN.SOL,
                amount: amountVal.numericAmount,
                date: new Date(),
                trx_id: null,
            },
            amount: amountVal.numericAmount,
            platformAddress: platformAddressStr,
            toAddress: platformAddressStr,
            status: constants.TRANSACTION_STATUS.PENDING,
        });

        await transaction.save();

        let txResult;
        try {
            transaction.status = constants.TRANSACTION_STATUS.PROCESSING;
            transaction.submittedAt = new Date();

            await transaction.save();

            txResult = await executeDepositTransaction({
                memo: memoVal.cleanMemo,
                amount: amountVal.numericAmount,
                recipientPublicKey: platformPubKey,
            });
        } catch (txErr) {
            transaction.status = constants.TRANSACTION_STATUS.FAILED;
            transaction.failureReason = `Transaction Execution Error: ${txErr.message}`;

            await transaction.save();

            log1(["Deposit execution failed:", txErr.message]);
            return errorResponse("Deposit execution failed");
        };

        transaction.transactionSignature = txResult.signature;
        transaction.memo.trx_id = txResult.signature;

        await transaction.save();

        const verifyResult = await verifyDepositTransaction({
            signature: txResult.signature,
            expectedAddress: platformAddressStr,
            expectedAmount: amountVal.numericAmount,
            expectedMemo: memoVal.cleanMemo,
        });

        if (!verifyResult.isValid) {
            transaction.status = constants.TRANSACTION_STATUS.FAILED;
            transaction.failureReason = verifyResult.failureReason;

            await transaction.save();

            log1(["Deposit verification failed:", verifyResult.failureReason]);
            return errorResponse("Deposit verification failed");
        };

        const confirmedTransaction = await Transaction.findOneAndUpdate(
            {
                _id: transaction._id,
                status: constants.TRANSACTION_STATUS.PROCESSING,
                transactionSignature: txResult.signature,
            },
            {
                $set: {
                    status: constants.TRANSACTION_STATUS.CONFIRMED,
                    confirmedAt: new Date(),
                    slot: verifyResult.slot,
                    blockTime: verifyResult.blockTime,
                },
            },
            { new: true }
        );

        if (!confirmedTransaction) {
            return errorResponse("Transaction is not eligible for confirmation or was already processed.");
        };

        const updatedUser = await User.findByIdAndUpdate(
            user._id,
            {
                $inc: {
                    solBalance: amountVal.numericAmount,
                    btcrBalance: amountVal.numericAmount,
                },
            },
            { new: true }
        );

        if (!updatedUser) {
            return errorResponse("User not found while crediting deposit.");
        };

        const newNotif = await Notification.create({
            userId: user._id,
            title: 'Deposit Confirmed',
            message: `Your deposit of ${amountVal.numericAmount} SOL has been verified & confirmed on Solana!`,
            type: 'DEPOSIT',
            amount: amountVal.numericAmount,
            transactionSignature: txResult.signature,
            isRead: false,
        });

        emitToUser(user._id, 'newNotification', newNotif);
        emitToUser(user._id, 'deposit_confirmed', {
            txId: transaction.txId,
            amount: amountVal.numericAmount,
            signature: txResult.signature,
        });

        return successResponse(`Successfully deposited ${amountVal.numericAmount} SOL!`,
            {
                txId: transaction.txId,
                amount: transaction.amount,
                signature: transaction.transactionSignature,
                status: transaction.status,
                updatedSolBalance: updatedUser.solBalance,
                explorerUrl: `https://explorer.solana.com/tx/${transaction.transactionSignature}?cluster=devnet`,
            },
        );
    } catch (err) {
        log1(['Error in deposit/create API route:', err.message]);
        return errorResponse(messages.unexpectedDataError);
    };
};

module.exports = { POST };