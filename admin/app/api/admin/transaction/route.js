'use strict';

const mongoose = require('mongoose');
const messages = require('../../../../lib/messages');
const constants = require('../../../../lib/constants');
const { verifySession } = require('../../../../lib/session');
const { errorResponse, successResponse, authErrorResponse, log1 } = require('../../../../lib/general');
const Transaction = require('../../../../lib/models/transaction.model');

async function GET(req) {
    try {
        const sessionAuth = await verifySession(req);
        if (!sessionAuth || !sessionAuth.adminId) {
            return authErrorResponse(messages.unauthorizedAccess);
        };

        const { searchParams } = new URL(req.url);

        const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
        const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10', 10)));

        const txType = (searchParams.get('txType') || '');
        const txStatus = searchParams.get('txStatus') || '';
        const userId = searchParams.get('userId') || '';

        const filter = {};

        if (txStatus) {
            filter.status = Number(txStatus);
        };

        if (userId && mongoose.isValidObjectId(userId)) {
            filter.userId = userId;
        };

        if (txType) {
            filter.type = Number(txType);
        };

        const totalCount = await Transaction.countDocuments(filter);
        const totalPages = Math.ceil(totalCount / limit) || 0;

        let currentPage = page;
        if (totalPages > 0 && page > totalPages) {
            currentPage = totalPages;
        };

        const skip = (currentPage - 1) * limit;

        const transactions = await Transaction.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        return successResponse('Transaction details fetched successfully.', {
            transactions,
            pagination: {
                totalCount,
                totalPages,
                currentPage,
                limit,
            },
        });
    } catch (error) {
        log1(['Error in admin transaction details GET:', error.message]);
        return errorResponse(messages.unexpectedDataError);
    };
};

const dynamic = 'force-dynamic';
module.exports = { dynamic, GET };