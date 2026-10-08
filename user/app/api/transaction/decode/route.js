const { decodeTransactionDetails } = require('../../../../lib/services/solana.service');
const { errorResponse, successResponse, log1 } = require("../../../../lib/general");

const BASE58_REGEX = /^[1-9A-HJ-NP-Za-km-z]+$/;

async function POST(req) {
    try {
        const body = await req.json();
        const { signature } = body;

        if (!signature || typeof signature !== 'string' || !signature.trim()) {
            return errorResponse("Transaction signature is required.");
        };

        const cleanSig = signature.trim();

        if (cleanSig.length < 80 || cleanSig.length > 95 || !BASE58_REGEX.test(cleanSig)) {
            return errorResponse("Invalid Solana transaction signature format. Signature must be a valid Base58 string (80-90 characters).");
        };

        const decoded = await decodeTransactionDetails(cleanSig);

        return successResponse("Transaction decoded successfully.", decoded);
    } catch (err) {
        log1(['Error in transaction/decode API route:', err.message]);
        return errorResponse("Could not decode transaction signature.");
    };
};

module.exports = { POST };