'use strict';

const mongoose = require('mongoose');
const constants = require('../constants');

const TransactionSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            index: true,
        },
        txId: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            index: true,
        },
        type: {
            type: Number,
            enum: Object.values(constants.TRX_TYPE),
            required: true,
            index: true,
        },
        coin: {
            type: String,
            enum: Object.values(constants.COIN),
            default: constants.COIN.SOL,
        },
        amount: {
            type: Number,
            required: true,
            min: 0.000000001,
        },
        platformFee: {
            type: Number,
            default: 0,
        },
        memo: {
            type: String,
            required: true,
            trim: true,
            index: true,
        },
        platformAddress: {
            type: String,
            trim: true,
            default: '',
        },
        fromAddress: {
            type: String,
            trim: true,
            default: '',
        },
        toAddress: {
            type: String,
            trim: true,
            default: '',
        },
        transactionSignature: {
            type: String,
            unique: true,
            sparse: true,
            trim: true,
            index: true,
        },
        status: {
            type: Number,
            enum: Object.values(constants.TRANSACTION_STATUS),
            default: constants.TRANSACTION_STATUS.PENDING,
        },
        requestedAt: {
            type: Date,
            default: Date.now,
        },
        submittedAt: {
            type: Date,
        },
        confirmedAt: {
            type: Date,
        },
        failureReason: {
            type: String,
            default: null,
        },
        slot: {
            type: Number,
            default: null,
        },
        blockTime: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    },
);

TransactionSchema.index({ type: 1, status: 1, createdAt: -1 });
TransactionSchema.index({ userId: 1, type: 1, createdAt: -1 });
TransactionSchema.index({ platformAddress: 1 });

module.exports = mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema);