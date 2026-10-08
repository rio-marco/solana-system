const constants = require('../../../../lib/constants');
const messages = require('../../../../lib/messages');
const { verifySession } = require('../../../../lib/session');
const { verifyDepositTransaction } = require('../../../../lib/services/verification.service');
const { errorResponse, successResponse, authErrorResponse, log1 } = require("../../../../lib/general");
const Deposit = require('../../../../lib/models/deposit.model');

async function POST(req) {
    try {
        const sessionAuth = await verifySession(req);
        if (!sessionAuth) {
            return authErrorResponse(messages.unauthorizedAccess);
        };

        const body = await req.json();
        const { signature, expectedAddress, expectedAmount, expectedMemo } = body;

        if (!signature || !expectedAddress || !expectedAmount || !expectedMemo) {
            return errorResponse("Signature, expectedAddress, expectedAmount, and expectedMemo are required.");
        };

        const result = await verifyDepositTransaction({
            signature: signature.trim(),
            expectedAddress: expectedAddress.trim(),
            expectedAmount: Number(expectedAmount),
            expectedMemo: expectedMemo.trim(),
        });

        if (!result.isValid) {
            return errorResponse(result.failureReason);
        };

        return successResponse("Deposit transaction verified successfully!", result);
    } catch (err) {
        log1(['Error in deposit/verify API route:', err.message]);
        return errorResponse(messages.unexpectedDataError);
    };
};

module.exports = { POST };