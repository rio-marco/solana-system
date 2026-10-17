'use strict';

const mongoose = require('mongoose');
const constants = require('../constants');

const TransactionSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, "user_id is required"],
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
            default: constants.COIN.BTCR,
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
            _id: false,
            id: {
                type: String,
                default: null,
            },
            trx_id: {
                type: String,
                default: null,
            },
            coin: {
                type: String,
                enum: Object.values(constants.COIN),
                default: null,
            },
            amount: {
                type: Number,
                default: null,
            },
            date: {
                type: Date,
                default: null,
            },
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

TransactionSchema.index({
    userId: 1,
    type: 1,
    status: 1,
    createdAt: -1,
    platformAddress: 1,
});

module.exports = mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema);