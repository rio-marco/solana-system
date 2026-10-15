'use strict';

const constants = require('./constants');

const { NAME_MIN_LENGTH, NAME_MAX_LENGTH } = constants.MANAGER;

function parseManagerInput(body, { partial = false } = {}) {
    const source = body && typeof body === 'object' ? body : {};
    const data = {};

    if (!partial || source.name !== undefined) {
        const name = (source.name === undefined || source.name === null ? '' : String(source.name)).trim();

        if (!name) {
            return { error: 'Manager name is required.', data: null };
        };

        if (name.length < NAME_MIN_LENGTH || name.length > NAME_MAX_LENGTH) {
            return { error: `Manager name must be between ${NAME_MIN_LENGTH} and ${NAME_MAX_LENGTH} characters.`, data: null };
        };

        data.name = name;
    };

    if (!partial || source.email !== undefined) {
        const email = (source.email === undefined || source.email === null ? '' : String(source.email)).trim().toLowerCase();

        if (!email) {
            return { error: 'Email is required.', data: null };
        };

        if (!constants.EMAIL_REGEX.test(email)) {
            return { error: 'Please enter a valid email address.', data: null };
        };

        data.email = email;
    };

    if (!partial || source.countryCode !== undefined) {
        const countryCode = (source.countryCode === undefined || source.countryCode === null ? '' : String(source.countryCode)).trim();

        if (countryCode && !constants.COUNTRY_CODE_REGEX.test(countryCode)) {
            return { error: 'Please select a valid country code.', data: null };
        };

        data.countryCode = countryCode;
    };

    if (source.phoneNumber !== undefined) {
        const phone = (source.phoneNumber === undefined || source.phoneNumber === null ? '' : String(source.phoneNumber)).trim();

        if (phone && !constants.PHONE_DIGITS_REGEX.test(phone)) {
            return { error: 'Please enter a valid phone number (digits only).', data: null };
        };

        data.phoneNumber = phone;
    };

    if (!partial || source.status !== undefined) {
        if (source.status === undefined || source.status === null || String(source.status).trim() === '') {
            return { error: 'Status is required.', data: null };
        };

        const status = Number(source.status);

        if (!Object.values(constants.MANAGER_STATUS).includes(status)) {
            return { error: 'Invalid status value.', data: null };
        };

        data.status = status;
    };

    if (data.phoneNumber && !data.countryCode) {
        return { error: 'Country code is required when a phone number is provided.', data: null };
    };

    if (data.phoneNumber) {
        const length = constants.COUNTRY_PHONE_LENGTHS[data.countryCode] || constants.DEFAULT_PHONE_LENGTH;

        if (data.phoneNumber.length < length.min || data.phoneNumber.length > length.max) {
            const expected = length.min === length.max ? `${length.min}` : `${length.min}-${length.max}`;
            return { error: `Phone number must be ${expected} digits for the selected country.`, data: null };
        };
    };

    if (!data.phoneNumber && data.countryCode !== undefined) {
        data.countryCode = '';
    };

    return { error: null, data };
};

module.exports = { parseManagerInput };