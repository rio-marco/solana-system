const twoFactor = require("node-2fa");
const messages = require("../messages");
const generalLib = require("../lib/general.lib");

const twoFactorAuthLib = {

    generateSecret: async (accountId) => {
        try {
            const secret = twoFactor.generateSecret({
                name: "Aurum Gold - User",
                account: accountId,
            });

            return generalLib.success_res("2FA secret generated successfully", secret);
        } catch (error) {
            generalLib.log1(["Error in generateSecret ----->", error]);
            return generalLib.error_res(messages.unexpectedDataError);
        };
    },

    verifyToken: async (secret, code) => {
        try {
            let response = twoFactor.verifyToken(secret, code);

            if (response === null) {
                return generalLib.error_res("Google 2FA code is an invalid code.");
            } else if (response.delta === 0) {
                return generalLib.success_res("Google 2FA code is valid.");
            } else if (response.delta === -1) {
                return generalLib.error_res("Google 2FA code is a past code.");
            } else if (response.delta === 1) {
                return generalLib.error_res("Google 2FA code is a future code.");
            };

            return generalLib.error_res("Google 2FA code is an invalid code.");
        } catch (error) {
            generalLib.log1(["Error in verifyToken ----->", error]);
            return generalLib.error_res(messages.unexpectedDataError);
        };
    },
};

module.exports = twoFactorAuthLib;