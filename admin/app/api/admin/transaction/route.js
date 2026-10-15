'use strict';

const mongoose = require('mongoose');
const messages = require('../../../../lib/messages');
const constants = require('../../../../lib/constants');
const { verifySession } = require('../../../../lib/session');
const { errorResponse, successResponse, authErrorResponse, log1 } = require('../../../../lib/general');
const User = require('../../../../lib/models/user.model');
const Deposit = require('../../../../lib/models/deposit.model');
const Withdrawal = require('../../../../lib/models/withdrawal.model');

async function GET(req, { params }) {
    try {
        const sessionAuth = await verifySession(req);
        if (!sessionAuth || !sessionAuth.adminId) {
            return authErrorResponse(messages.unauthorizedAccess);
        };

        const { searchParams } = new URL(req.url);

        const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
        const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10', 10)));
        const skip = (page - 1) * limit;

        const txType = (searchParams.get('txType') || 'ALL').toUpperCase();
        const txStatus = searchParams.get('txStatus') || '';
        const userId = searchParams.get('userId') || '';

        let transactions = [];
        let txPagination = {
            totalCount: 0,
            totalPages: 0,
            currentPage: page,
            limit: limit,
        };

        const depositQuery = {};
        const withdrawalQuery = {};

        if (txStatus && txStatus !== 'ALL') {
            depositQuery.status = txStatus;
            withdrawalQuery.status = txStatus;
        };

        if (userId && mongoose.isValidObjectId(userId)) {
            depositQuery.userId = userId;
            withdrawalQuery.userId = userId;
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
                fromAddress: d.platformAddress,
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
        txPagination.totalPages = Math.ceil(combined.length / limit) || 0;
        if (page > txPagination.totalPages && txPagination.totalPages > 0) {
            txPagination.currentPage = txPagination.totalPages;
        };

        transactions = combined.slice(skip, skip + limit);

        return successResponse('Transaction details fetched successfully.', {
            transactions,
            pagination: txPagination,
        });
    } catch (error) {
        log1(['Error in admin transaction details GET:', error.message]);
        return errorResponse(messages.unexpectedDataError);
    };
};

const dynamic = 'force-dynamic';
module.exports = { dynamic, GET };