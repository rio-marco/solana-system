const Validator = require("validatorjs");
const generalLib = require('../lib/general.lib');

const validateRules = {
    auth: {
        signUp: {
            fullName: "required|string|max:60",
            email: "required|email",
        },
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
        verify2FACode: {
            email: "required|email",
            twoFACode: "required",
        },
    },

    user: {
        updateProfile: {
            documentNumber: "required",
            dialCode: "required_with:phoneNumber",
            phoneNumber: "required_with:dialCode",
            profileImage: "required",
        },
        enableTwoFA: {
            twoFASecret: "required",
            twoFACode: "required",
        },
        disableTwoFA: {
            twoFACode: "required",
        },
        verifyTwoFACode: {
            twoFACode: "required",
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

        return generalLib.error_res(error);
    };

    return generalLib.success_res("Success");
};

const getRules = (rules) => {
    let rule = rules.split(".");
    return validateRules[rule[0]][rule[1]];
};

module.exports = customValidation;