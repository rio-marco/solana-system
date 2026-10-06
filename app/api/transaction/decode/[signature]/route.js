const { decodeTransactionDetails } = require('../../../../../lib/services/solana.service');
const messages = require('../../../../../lib/messages');
const { errorResponse, successResponse, log1 } = require("../../../../../lib/general");

async function GET(req, { params }) {
    try {
        const { signature } = params;
        if (!signature || typeof signature !== 'string' || !signature.trim()) {
            return errorResponse("Transaction signature is required.");
        };

        const decoded = await decodeTransactionDetails(signature.trim());

        return successResponse("Transaction decoded successfully.", decoded);
    } catch (err) {
        log1(['Error in transaction/decode/[signature] API route:', err.message]);
        return errorResponse(messages.unexpectedDataError);
    };
};

module.exports = { GET };