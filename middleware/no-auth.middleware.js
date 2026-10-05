const constants = require("../config/constant");
const generalLib = require("../utils/lib/general.lib");
const messages = require("../utils/messages");

const noAuthMiddleware = (req, res, next) => {
    const isGet = req.method === "GET";

    try {
        const user = req.session?.user;
        if (!user) {
            return next();
        };

        if (isGet) {
            return res.redirect("/dashboard");
        };

        return res.status(constants.STATUS.OK).json(generalLib.success_res("You are already logged in.", { isLoggedIn: true }));
    } catch (error) {
        generalLib.log1(["Error in noAuthMiddleware ----->", error]);

        if (isGet) {
            return res.redirect("/dashboard");
        };

        return res.status(constants.STATUS.BAD_REQUEST).json(generalLib.error_res(messages.unexpectedDataError));
    };
};

module.exports = noAuthMiddleware;