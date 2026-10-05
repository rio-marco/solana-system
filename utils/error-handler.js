const constants = require("../config/constant");
const generalLib = require("./lib/general.lib");
const messages = require("./messages");

const errorHandler = async (app) => {
    // handle error (which is not handled inside and unfortunately returned)
    app.use((error, req, res, next) => {
        generalLib.log1(["Error in errorHandler ----->", error]);

        const method = req.method;

        if (!error.status || error.status === 500) {
            if (method === "GET") {
                return res.render("error500", { layout: false });
            } else {
                return res.status(constants.STATUS.INTERNAL_SERVER_ERROR).json(errorResponse(messages.internalServerError));
            };
        };
    });

    // handle 404
    app.use(async (req, res, next) => {
        const method = req.method;

        if (method === "GET") {
            return res.render("error404", { layout: false });
        } else {
            return res.status(constants.STATUS.NOT_FOUND).json(errorResponse(messages.invalidEndpointOrMethod));
        };
    });
};

module.exports = errorHandler;