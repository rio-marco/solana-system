const { v4: uuidv4 } = require('uuid');
const { validateMemo, validateAmount } = require('../utils/validation');
const { hasPlatformAddress, generateNewPlatformAddress, getPlatformReceivingAddress, getOnChainBalance, executeDepositTransaction } = require('../services/solana.service');
const { verifyDepositTransaction } = require('../services/transaction-verification.service');
const Deposit = require('../models/deposit.model');
const User = require('../models/user.model');
const Notification = require('../models/notification.model');
const generalLib = require('../utils/lib/general.lib');
const messages = require('../utils/messages');
const constants = require("../config/constant");

const getAddress = async (req, res, next) => {
    try {
        const isSet = await hasPlatformAddress();
        const shouldForceGenerate = req.query.generate === 'true' || req.query.force === 'true';

        if (shouldForceGenerate) {
            const newPubKey = await generateNewPlatformAddress();

            return res.status(constants.STATUS.OK).json(generalLib.success_res('New platform receiving address generated successfully!', {
                exists: true,
                address: newPubKey.toBase58(),
                network: process.env.SOLANA_NETWORK || 'devnet',
            }));
        };

        if (isSet) {
            const platformPubKey = await getPlatformReceivingAddress(true);

            return res.status(constants.STATUS.OK).json(generalLib.success_res('successfully!', {
                exists: true,
                address: platformPubKey.toBase58(),
                network: process.env.SOLANA_NETWORK || 'devnet',
            }));
        };

        return res.status(constants.STATUS.OK).json(generalLib.success_res('Platform receiving address is not generated yet.', {
            exists: false,
            address: null,
            network: process.env.SOLANA_NETWORK || 'devnet',
        }));
    } catch (err) {
        generalLib.log1(["getAddress Error----------->", err.message]);
        return res.status(constants.STATUS.INTERNAL_SERVER_ERROR).json(generalLib.error_res(messages.unexpectedDataError));
    }
};

const generateAddress = async (req, res, next) => {
    try {
        const newPubKey = await generateNewPlatformAddress();

        return res.status(constants.STATUS.OK).json(generalLib.success_res('Brand new platform deposit address generated successfully!', {
            exists: true,
            address: newPubKey.toBase58(),
            network: process.env.SOLANA_NETWORK || 'devnet',
        }));
    } catch (err) {
        generalLib.log1(["generateAddress Error----------->", err.message]);
        return res.status(constants.STATUS.INTERNAL_SERVER_ERROR).json(generalLib.error_res(messages.unexpectedDataError));
    }
};

const getBalance = async (req, res, next) => {
    try {
        const platformPubKey = await getPlatformReceivingAddress(true);
        const balanceData = await getOnChainBalance(platformPubKey);

        return res.status(constants.STATUS.OK).json(generalLib.success_res('get balance successfully!', {
            address: platformPubKey.toBase58(),
            balance: balanceData.balance,
            lamports: balanceData.lamports,
            currency: balanceData.currency,
        }));
    } catch (err) {
        generalLib.log1(["getBalance Error----------->", err.message]);
        return res.status(constants.STATUS.INTERNAL_SERVER_ERROR).json(generalLib.error_res(messages.unexpectedDataError));
    }
};

const createDeposit = async (req, res, next) => {
    try {
        const { memo, amount } = req.body;

        const memoVal = validateMemo(memo);
        if (!memoVal.isValid) {
            return res.status(constants.STATUS.BAD_REQUEST).json(generalLib.error_res(memoVal.error));
        };

        const amountVal = validateAmount(amount);
        if (!amountVal.isValid) {
            return res.status(constants.STATUS.BAD_REQUEST).json(generalLib.error_res(amountVal.error));
        };

        const platformPubKey = await getPlatformReceivingAddress(true);
        const platformAddressStr = platformPubKey.toBase58();

        const depositId = `DEP-${uuidv4().substring(0, 8).toUpperCase()}`;

        const deposit = new Deposit({
            userId: req.user ? req.user._id : null,
            depositId,
            memo: memoVal.cleanMemo,
            amount: amountVal.numericAmount,
            platformAddress: platformAddressStr,
            status: 'PENDING',
            requestedAt: new Date(),
        });

        await deposit.save();

        let txResult;
        try {
            txResult = await executeDepositTransaction({
                memo: memoVal.cleanMemo,
                amount: amountVal.numericAmount,
                recipientPublicKey: platformPubKey,
            });

            deposit.transactionSignature = txResult.signature;
            deposit.status = 'PROCESSING';
            deposit.submittedAt = new Date();
            await deposit.save();
        } catch (txErr) {
            deposit.status = 'FAILED';
            deposit.failureReason = txErr.message;
            await deposit.save();

            generalLib.log1(["createDeposit Error----------->", txErr.message]);
            return res.status(constants.STATUS.BAD_REQUEST).json(generalLib.error_res("Solana transaction failed"));
        };

        const verification = await verifyDepositTransaction({
            signature: txResult.signature,
            expectedAddress: platformAddressStr,
            expectedAmount: amountVal.numericAmount,
            expectedMemo: memoVal.cleanMemo,
        });

        if (verification.isValid) {
            deposit.status = 'CONFIRMED';
            deposit.confirmedAt = new Date();
            deposit.slot = verification.slot;
            deposit.blockTime = verification.blockTime;

            await deposit.save();

            // Link to user by req.user or by assigned unique memo
            let targetUser = req.user ? await User.findById(req.user._id) : null;
            if (!targetUser && deposit.memo) {
                targetUser = await User.findOne({ memo: deposit.memo });
            }

            let updatedUserBalance = 0;
            if (targetUser) {
                deposit.userId = targetUser._id;
                await deposit.save();

                targetUser.walletBalance = (targetUser.walletBalance || 0) + deposit.amount;
                await targetUser.save();
                updatedUserBalance = targetUser.walletBalance;

                // Create real-time notification
                const notification = await Notification.create({
                    userId: targetUser._id,
                    title: 'Deposit Completed!',
                    message: `Deposit of ${deposit.amount} SOL (Memo: ${deposit.memo}) confirmed & credited to your wallet balance.`,
                    type: 'DEPOSIT',
                    amount: deposit.amount,
                    transactionSignature: deposit.transactionSignature,
                });

                // WebSocket emission to user's browser
                const io = req.app.get('io');
                if (io) {
                    io.to(`user_${targetUser._id}`).emit('notification', {
                        notification,
                        newBalance: updatedUserBalance,
                        depositId: deposit.depositId,
                        transactionSignature: deposit.transactionSignature,
                    });

                    // io.to(`user_${targetUser._id}`).emit('deposit_completed', {
                    //     notification,
                    //     deposit,
                    //     newBalance: updatedUserBalance,
                    // });
                };
            };

            return res.status(constants.STATUS.OK).json(generalLib.success_res('Deposit created and verified on Solana blockchain!', {
                depositId: deposit.depositId,
                signature: deposit.transactionSignature,
                status: deposit.status,
                amount: deposit.amount,
                memo: deposit.memo,
                confirmedAt: deposit.confirmedAt,
                slot: deposit.slot,
                updatedWalletBalance: updatedUserBalance,
            }));
        } else {
            deposit.status = 'FAILED';
            deposit.failureReason = verification.failureReason;
            await deposit.save();

            generalLib.log1(["createDeposit verification failureReason Error----------->", verification.failureReason]);
            return res.status(constants.STATUS.BAD_REQUEST).json(generalLib.error_res("Transaction created but on-chain verification failed"));
        }
    } catch (err) {
        generalLib.log1(["createDeposit Error Message----------->", err.message]);
        return res.status(constants.STATUS.INTERNAL_SERVER_ERROR).json(generalLib.error_res(messages.unexpectedDataError));
    };
};

const verifyDeposit = async (req, res, next) => {
    try {
        const { depositId, signature } = req.body;

        if (!depositId && !signature) {
            return res.status(constants.STATUS.BAD_REQUEST).json(generalLib.error_res("Please provide either depositId or signature"));
        };

        let deposit;
        if (depositId) {
            deposit = await Deposit.findOne({ depositId });
        } else {
            deposit = await Deposit.findOne({ transactionSignature: signature });
        };

        if (!deposit) {
            return res.status(constants.STATUS.BAD_REQUEST).json(generalLib.error_res("Deposit record not found"));
        };

        const targetSignature = signature || deposit.transactionSignature;

        if (!targetSignature) {
            return res.status(constants.STATUS.BAD_REQUEST).json(generalLib.error_res("Deposit record does not have a valid transaction signature"));
        };

        const verification = await verifyDepositTransaction({
            signature: targetSignature,
            expectedAddress: deposit.platformAddress,
            expectedAmount: deposit.amount,
            expectedMemo: deposit.memo,
        });

        if (verification.isValid) {
            deposit.status = 'CONFIRMED';
            deposit.transactionSignature = targetSignature;
            deposit.confirmedAt = new Date();
            deposit.slot = verification.slot;
            deposit.blockTime = verification.blockTime;
            deposit.failureReason = null;
            await deposit.save();

            let targetUser = deposit.userId ? await User.findById(deposit.userId) : null;
            if (!targetUser && deposit.memo) {
                targetUser = await User.findOne({ memo: deposit.memo });
            }

            let updatedUserBalance = 0;
            if (targetUser) {
                deposit.userId = targetUser._id;
                await deposit.save();

                targetUser.walletBalance = (targetUser.walletBalance || 0) + deposit.amount;
                await targetUser.save();
                updatedUserBalance = targetUser.walletBalance;

                const notification = await Notification.create({
                    userId: targetUser._id,
                    title: 'Deposit Confirmed!',
                    message: `Deposit of ${deposit.amount} SOL verified and added to your wallet balance.`,
                    type: 'DEPOSIT',
                    amount: deposit.amount,
                    transactionSignature: deposit.transactionSignature,
                });

                const io = req.app.get('io');
                if (io) {
                    io.to(`user_${targetUser._id}`).emit('notification', {
                        notification,
                        newBalance: updatedUserBalance,
                        depositId: deposit.depositId,
                        transactionSignature: deposit.transactionSignature,
                    });

                    // io.to(`user_${targetUser._id}`).emit('deposit_completed', {
                    //     notification,
                    //     deposit,
                    //     newBalance: updatedUserBalance,
                    // });
                };
            };

            return res.status(constants.STATUS.OK).json(generalLib.success_res('Deposit verified on Solana blockchain!', {
                depositId: deposit.depositId,
                status: deposit.status,
                signature: deposit.transactionSignature,
                amount: deposit.amount,
                memo: deposit.memo,
                slot: deposit.slot,
                confirmedAt: deposit.confirmedAt,
                updatedWalletBalance: updatedUserBalance,
            }));
        } else {
            deposit.status = 'FAILED';
            deposit.failureReason = verification.failureReason;
            await deposit.save();

            generalLib.log1(["verifyDeposit verification failureReason Error----------->", verification.failureReason]);
            return res.status(constants.STATUS.BAD_REQUEST).json(generalLib.error_res("On-chain verification failed"));
        };
    } catch (err) {
        generalLib.log1(["verifyDeposit Error----------->", err.message]);
        return res.status(constants.STATUS.INTERNAL_SERVER_ERROR).json(generalLib.error_res(messages.unexpectedDataError));
    }
};

const getDepositById = async (req, res, next) => {
    try {
        const { depositId } = req.params;
        const deposit = await Deposit.findOne({ depositId });

        if (!deposit) {
            return res.status(constants.STATUS.BAD_REQUEST).json(generalLib.error_res("Deposit record not found"));
        };

        return res.status(constants.STATUS.OK).json(generalLib.success_res('Get Deposit details successfully!', {
            deposit
        }));
    } catch (err) {
        generalLib.log1(["getDepositById Error----------->", err.message]);
        return res.status(constants.STATUS.INTERNAL_SERVER_ERROR).json(generalLib.error_res(messages.unexpectedDataError));
    };
};

module.exports = {
    getAddress,
    generateAddress,
    getBalance,
    createDeposit,
    verifyDeposit,
    getDepositById,
};