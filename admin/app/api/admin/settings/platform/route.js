'use strict';

const messages = require('../../../../../lib/messages');
const { verifySession } = require('../../../../../lib/session');
const { errorResponse, successResponse, authErrorResponse, log1 } = require('../../../../../lib/general');
const Setting = require('../../../../../lib/models/setting.model');

const ALLOWED_KEYS = [
    'WITHDRAWAL_PLATFORM_FEE',
    'SOLANA_PLATFORM_PUBLIC_KEY',
    'UNLOCK_PERIOD_IN_DAYS',
];

async function GET(req) {
    try {
        const sessionAuth = await verifySession(req);
        if (!sessionAuth || !sessionAuth.adminId) {
            return authErrorResponse(messages.unauthorizedAccess);
        };

        const settings = await Setting.find({ key: { $in: ALLOWED_KEYS } }).lean();

        const result = {};
        ALLOWED_KEYS.forEach((k) => {
            const found = settings.find((s) => s.key === k);
            result[k] = found ? found.value : '';
        });

        result['SOLANA_NETWORK'] = process.env.SOLANA_NETWORK || 'devnet';

        return successResponse('Platform settings fetched successfully.', { settings: result });
    } catch (error) {
        log1(['Error in admin settings platform GET:', error.message]);
        return errorResponse(messages.unexpectedDataError);
    };
};

async function PATCH(req) {
    try {
        const sessionAuth = await verifySession(req);
        if (!sessionAuth || !sessionAuth.adminId) {
            return authErrorResponse(messages.unauthorizedAccess);
        };

        const body = await req.json();
        const updates = body.settings || {};

        const updatePromises = [];

        for (const key of ALLOWED_KEYS) {
            if (key in updates) {
                const val = String(updates[key] || '').trim();
                if (!val) {
                    return errorResponse(`Value for "${key}" cannot be empty.`);
                };

                updatePromises.push(
                    Setting.setVal(key, val)
                );
            };
        };

        if (updatePromises.length === 0) {
            return errorResponse('No valid settings provided to update.');
        };

        await Promise.all(updatePromises);

        return successResponse('Platform settings updated successfully.');
    } catch (error) {
        log1(['Error in admin settings platform PATCH:', error.message]);
        return errorResponse(messages.unexpectedDataError);
    };
};

const dynamic = 'force-dynamic';
module.exports = { dynamic, GET, PATCH };