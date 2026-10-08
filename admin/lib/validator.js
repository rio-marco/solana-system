const Validator = require("validatorjs");
const { errorResponse, successResponse, } = require('./general');

const validateRules = {
    auth: {
        signIn: {
            email: "required|email",
        },
        verify_otp: {
            email: "required|email",
            otp: "required|min:6|max:6",
        },
        direct_link: {
            email: "required|email",
            token: "required",
        },
    },
};

const customValidation = async (data, rules, customMessages = {}) => {
    let validation = new Validator(data, getRules(rules), customMessages);

    if (validation.fails()) {
        let error = "";

        const errorObject = validation.errors.errors;
        error = Object.values(errorObject)[0][0];

        error = error.replace("The ", "").replace(" field", "");

        return errorResponse(error);
    };

    return successResponse("Success");
};

const getRules = (rules) => {
    let rule = rules.split(".");
    return validateRules[rule[0]][rule[1]];
};

module.exports = customValidation;