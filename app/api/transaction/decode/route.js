const { decodeTransactionDetails } = require('../../../../lib/services/solana.service');
const messages = require('../../../../lib/messages');
const { errorResponse, successResponse, log1 } = require("../../../../lib/general");

async function POST(req) {
    try {
        const body = await req.json();
        const { signature } = body;

        if (!signature || typeof signature !== 'string' || !signature.trim()) {
            return errorResponse("Transaction signature is required.");
        };

        const decoded = await decodeTransactionDetails(signature.trim());

        return successResponse("Transaction decoded successfully.", decoded);
    } catch (err) {
        log1(['Error in transaction/decode API route:', err.message]);
        return errorResponse(messages.unexpectedDataError);
    };
};

module.exports = { POST };