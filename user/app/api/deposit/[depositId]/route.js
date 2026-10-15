const messages = require('../../../../lib/messages');
const { verifySession } = require('../../../../lib/session');
const Transaction = require('../../../../lib/models/transaction.model');
const { errorResponse, successResponse, authErrorResponse, log1 } = require("../../../../lib/general");

async function GET(req, { params }) {
    try {
        const sessionAuth = await verifySession(req);
        if (!sessionAuth) {
            return authErrorResponse(messages.unauthorizedAccess);
        };

        const { depositId } = params;
        const deposit = await Transaction.findOne({ txId: depositId }).lean();

        if (!deposit) {
            return errorResponse("Deposit record not found.");
        };

        return successResponse("Deposit record fetched successfully.", { deposit });
    } catch (err) {
        log1(['Error in deposit/[depositId] API route:', err.message]);
        return errorResponse(messages.unexpectedDataError);
    };
};

module.exports = { GET };