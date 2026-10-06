'use strict';

const { NextResponse } = require('next/server');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const Mnemonic = require('bitcore-mnemonic');
const constants = require('./constants');
const User = require('./models/user.model');

function errorResponse(msg = '', data = {}) {
    return NextResponse.json(
        {
            flag: 0,
            msg: msg.length == 0 ? "Error" : msg,
            data: data || {},
        },
        { status: 400 }
    );
};

function successResponse(msg = '', data = {}) {
    return NextResponse.json(
        {
            flag: 1,
            msg,
            data: data || {},
        },
        { status: 200 }
    );
};

function validationResponse(msg = '', data = {}) {
    return NextResponse.json(
        {
            flag: 2,
            msg: msg.length == 0 ? "Validation Error" : msg,
            data: data || {},
        },
        { status: 400 }
    );
};

function invalidTokenResponse(msg = '', data = {}) {
    return NextResponse.json(
        {
            flag: 4,
            msg,
            data: data || {},
        },
        { status: 401 }
    );
};

function authErrorResponse(msg = '', data = {}) {
    return NextResponse.json(
        {
            flag: 8,
            msg: msg.length == 0 ? "Unauthorized Token" : msg,
            data: data || {},
        },
        { status: 401 }
    );
};

function log1(msg) {
    const d = new Date();
    console.log("[" + d.toLocaleString() + " " + d.getMilliseconds() + "] :", msg);
};

function isValidIp(ip) {
    const ipAddressRegex = /^(\d{1,3}\.){3}(\d{1,3})$/;
    return ipAddressRegex.test(ip);
};

function getIp(req) {
    const ip = req.headers['cf-connecting-ip'] ? req.headers['cf-connecting-ip'] : req.connection.remoteAddress;
    const parts = ip.split('::ffff:');
    return parts.length > 1 ? parts[1] : parts[0];
};

function generateRandomToken(length) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    };

    return result;
};

function generateOTP(length = 6) {
    if (process.env.NODE_ENV === 'local') return '123456';

    let otp = '';
    const characters = '0123456789';

    for (let i = 0; i < length; i++) {
        otp += characters.charAt(Math.floor(Math.random() * characters.length));
    };

    return otp;
};

function generateAuthToken(payload) {
    try {
        const token = jwt.sign(payload, process.env.AUTH_SECRET, {
            expiresIn: '365d',
        });

        return token;
    } catch (error) {
        log1(["Error in generateAuthToken ----->", error]);
        return null;
    };
};

async function generateUniqueMemo() {
    while (true) {
        try {
            const memo = crypto.randomInt(10000000, 100000000).toString();

            const existingMemo = await User.exists({ memo });

            if (!existingMemo) {
                return memo;
            };

        } catch (error) {
            log1(["Error in generateUniqueMemo----->", error]);
            throw error;
        };
    };
};

async function generateRecoveryPhrase(cipher) {
    let phrase = '';
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 5) {
        attempts++;
        const mnemonicObject = new Mnemonic();
        phrase = mnemonicObject.toString();

        const existing = await User.findOne({ recoveryPhrase: phrase }).lean();
        if (!existing) {
            isUnique = true;
        };
    };

    return phrase;
};

function encryptText(text) {
    try {
        const ciphering = process.env.CIPHERING;
        const secret_key = process.env.SECRET_KEY;
        const encryption_iv = process.env.ENCRYPTION_IV;

        const encryptor = crypto.createCipheriv(ciphering, secret_key, encryption_iv);
        const encrypted = encryptor.update(text, 'utf8', 'base64') + encryptor.final('base64');

        return encrypted;
    } catch (error) {
        log1(["Error in encryptText ----->", error]);
        return null;
    };
};

function decryptCipher(cipher) {
    try {
        const ciphering = process.env.CIPHERING;
        const secret_key = process.env.SECRET_KEY;
        const encryption_iv = process.env.ENCRYPTION_IV;

        const decryptor = crypto.createDecipheriv(ciphering, secret_key, encryption_iv);
        const decrypted = decryptor.update(cipher, 'base64', 'utf8') + decryptor.final('utf8');

        return decrypted;
    } catch (error) {
        log1(["Error in decryptCipher ----->", error]);
        return null;
    };
};

module.exports = {
    errorResponse,
    successResponse,
    validationResponse,
    invalidTokenResponse,
    authErrorResponse,
    log1,
    isValidIp,
    getIp,
    generateRandomToken,
    generateOTP,
    generateAuthToken,
    generateUniqueMemo,
    generateRecoveryPhrase,
    encryptText,
    decryptCipher,
};
