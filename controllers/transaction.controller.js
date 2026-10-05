const { decodeTransactionDetails } = require('../services/solana.service');
const Generallib = require('../utils/lib/general.lib');
const messages = require('../utils/messages');
const constants = require("../config/constant");

const decodeTransaction = async (req, res, next) => {
    try {
        const signature = req.body.transactionId || req.body.signature || req.query.signature;

        if (!signature || typeof signature !== 'string' || !signature.trim()) {
            return res.status(constants.STATUS.BAD_REQUEST).json(Generallib.error_res("Please provide a valid Transaction Id / signature."));
        };

        const transactionData = await decodeTransactionDetails(signature.trim());

        return res.status(constants.STATUS.OK).json(Generallib.success_res("Transaction decode successfully!", {
            transactionId: signature.trim(),
            transaction: transactionData,
        }));
    } catch (err) {
        Generallib.log1(["decodeTransaction Error----------->", err.message]);
        return res.status(constants.STATUS.INTERNAL_SERVER_ERROR).json(Generallib.error_res(messages.unexpectedDataError));
    };
};

module.exports = {
    decodeTransaction,
};