'use strict';

const mongoose = require('mongoose');
const messages = require('../../../../../lib/messages');
const constants = require('../../../../../lib/constants');
const { verifySession } = require('../../../../../lib/session');
const { errorResponse, successResponse, authErrorResponse, log1 } = require('../../../../../lib/general');
const User = require('../../../../../lib/models/user.model');
const Deposit = require('../../../../../lib/models/deposit.model');
const Withdrawal = require('../../../../../lib/models/withdrawal.model');

async function GET(req, { params }) {
    try {
        const sessionAuth = await verifySession(req);
        if (!sessionAuth || !sessionAuth.adminId) {
            return authErrorResponse(messages.unauthorizedAccess);
        };

        const userId = params?.id;

        if (!userId || !mongoose.isValidObjectId(userId)) {
            return errorResponse('Invalid user ID.');
        };

        const { searchParams } = new URL(req.url);
        const includeTransactions = searchParams.get('includeTransactions') || 'true';
        const includeSuspendHistory = searchParams.get('includeSuspendHistory') || 'true';

        const txPage = Math.max(1, parseInt(searchParams.get('txPage') || '1', 10));
        const txLimit = Math.min(100, Math.max(1, parseInt(searchParams.get('txLimit') || '10', 10)));

        const txType = (searchParams.get('txType') || 'ALL').toUpperCase();
        const txStatus = searchParams.get('txStatus') || '';

        const txSkip = (txPage - 1) * txLimit;

        const user = await User.findById(userId).select('-twoFASecret -recoveryPhrase').lean();

        if (!user) {
            return errorResponse('User not found.');
        };

        const backendUrl = process.env.USER_URL;
        const profilePhoto = user.profilePhoto?.trim() || '';
        let profilePhotoUrl = '';

        if (profilePhoto) {
            if (/^https?:\/\//i.test(profilePhoto)) {
                profilePhotoUrl = profilePhoto;
            } else if (backendUrl) {
                profilePhotoUrl = `${backendUrl}/${profilePhoto.replace(/^\/+/, '')}`;
            };
        };

        const userData = { ...user, profilePhoto: profilePhotoUrl };

        let transactions = [];
        let txPagination = {
            totalCount: 0,
            totalPages: 0,
            currentPage: txPage,
            limit: txLimit,
        };

        if (includeTransactions === 'true') {
            const depositQuery = { userId: user._id };
            const withdrawalQuery = { userId: user._id };

            if (txStatus && txStatus !== 'ALL') {
                depositQuery.status = txStatus;
                withdrawalQuery.status = txStatus;
            };

            const fetchDeposits = (txType === 'ALL' || txType === 'DEPOSIT')
                ? Deposit.find(depositQuery).lean()
                : Promise.resolve([]);
            const fetchWithdrawals = (txType === 'ALL' || txType === 'WITHDRAW')
                ? Withdrawal.find(withdrawalQuery).lean()
                : Promise.resolve([]);

            const [deposits, withdrawals] = await Promise.all([fetchDeposits, fetchWithdrawals]);

            let combined = [];

            for (const d of deposits) {
                combined.push({
                    _id: d._id,
                    transactionType: constants.TRX_TYPE.DEPOSIT,
                    amount: d.amount,
                    currency: d.currency,
                    status: d.status,
                    transactionSignature: d.transactionSignature,
                    memo: d.memo,
                    depositId: d.depositId,
                    createdAt: d.createdAt,
                    updatedAt: d.updatedAt,
                    confirmedAt: d.confirmedAt,
                    submittedAt: d.submittedAt,
                    requestedAt: d.requestedAt,
                    failureReason: d.failureReason,
                    platformAddress: d.platformAddress,
                    blockTime: d.blockTime,
                });
            };

            for (const w of withdrawals) {
                combined.push({
                    _id: w._id,
                    transactionType: constants.TRX_TYPE.WITHDRAW,
                    amount: w.amount,
                    currency: w.currency,
                    status: w.status,
                    transactionSignature: w.transactionSignature,
                    memo: w.memo,
                    withdrawId: w.withdrawId,
                    toAddress: w.toAddress,
                    fromAddress: w.fromAddress,
                    platformFee: w.platformFee,
                    createdAt: w.createdAt,
                    updatedAt: w.updatedAt,
                    confirmedAt: w.confirmedAt,
                    failureReason: w.failureReason,
                    blockTime: w.blockTime,
                });
            };

            combined.sort((a, b) => {
                const dateA = new Date(a.createdAt || a.confirmedAt || a.blockTime || 0);
                const dateB = new Date(b.createdAt || b.confirmedAt || b.blockTime || 0);
                return dateB - dateA;
            });

            txPagination.totalCount = combined.length;
            txPagination.totalPages = Math.ceil(combined.length / txLimit) || 0;
            if (txPage > txPagination.totalPages && txPagination.totalPages > 0) {
                txPagination.currentPage = txPagination.totalPages;
            };

            transactions = combined.slice(txSkip, txSkip + txLimit);
        };

        return successResponse('User details fetched successfully.', {
            user: userData,
            suspendHistory: includeSuspendHistory === 'true' ? (userData.suspendHistory || []) : [],
            transactions,
            pagination: txPagination,
        });
    } catch (error) {
        log1(['Error in admin user details GET:', error.message]);
        return errorResponse(messages.unexpectedDataError);
    };
};

const dynamic = 'force-dynamic';
module.exports = { dynamic, GET };