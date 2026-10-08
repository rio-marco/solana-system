const { v4: uuidv4 } = require('uuid');
const constants = require('../../../../lib/constants');
const messages = require('../../../../lib/messages');
const { verifySession } = require('../../../../lib/session');
const { validateMemo, validateAmount } = require('../../../../lib/validation');
const { getPlatformReceivingAddress, executeDepositTransaction } = require('../../../../lib/services/solana.service');
const { verifyDepositTransaction } = require('../../../../lib/services/verification.service');
const { emitToUser } = require('../../../../lib/socket');
const { errorResponse, successResponse, authErrorResponse, log1 } = require("../../../../lib/general");
const Deposit = require('../../../../lib/models/deposit.model');
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

        const depositId = `DEP-${uuidv4().substring(0, 8).toUpperCase()}`;

        const deposit = new Deposit({
            userId: user._id,
            depositId,
            memo: memoVal.cleanMemo,
            amount: amountVal.numericAmount,
            currency: 'SOL',
            platformAddress: platformAddressStr,
            status: 'PENDING',
        });

        await deposit.save();

        let txResult;
        try {
            deposit.status = 'PROCESSING';
            deposit.submittedAt = new Date();

            await deposit.save();

            txResult = await executeDepositTransaction({
                memo: memoVal.cleanMemo,
                amount: amountVal.numericAmount,
                recipientPublicKey: platformPubKey,
            });

            deposit.transactionSignature = txResult.signature;
            await deposit.save();
        } catch (txErr) {
            deposit.status = 'FAILED';
            deposit.failureReason = `Transaction Execution Error: ${txErr.message}`;
            await deposit.save();

            log1(["Deposit execution failed:", txErr.message]);
            return errorResponse("Deposit execution failed");
        };

        const verifyResult = await verifyDepositTransaction({
            signature: txResult.signature,
            expectedAddress: platformAddressStr,
            expectedAmount: amountVal.numericAmount,
            expectedMemo: memoVal.cleanMemo,
        });

        if (!verifyResult.isValid) {
            deposit.status = 'FAILED';
            deposit.failureReason = verifyResult.failureReason;
            await deposit.save();

            log1(["Deposit verification failed:", verifyResult.failureReason]);
            return errorResponse("Deposit verification failed");
        };

        deposit.status = 'CONFIRMED';
        deposit.confirmedAt = new Date();
        deposit.slot = verifyResult.slot;
        deposit.blockTime = verifyResult.blockTime;
        await deposit.save();

        const updatedUser = await User.findByIdAndUpdate(
            user._id,
            { $inc: { walletBalance: amountVal.numericAmount } },
            { new: true }
        );

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
            depositId: deposit.depositId,
            amount: amountVal.numericAmount,
            signature: txResult.signature,
        });

        return successResponse(`Successfully deposited ${amountVal.numericAmount} SOL!`,
            {
                depositId: deposit.depositId,
                amount: deposit.amount,
                signature: deposit.transactionSignature,
                status: deposit.status,
                updatedWalletBalance: updatedUser.walletBalance,
                explorerUrl: `https://explorer.solana.com/tx/${deposit.transactionSignature}?cluster=devnet`,
            },
        );
    } catch (err) {
        log1(['Error in deposit/create API route:', err.message]);
        return errorResponse(messages.unexpectedDataError);
    };
};

module.exports = { POST };