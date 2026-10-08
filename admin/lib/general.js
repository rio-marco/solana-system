'use strict';

if (global._bitcore) {
    delete global._bitcore;
};

const { NextResponse } = require('next/server');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

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
    if (process.env.NODE_ENV === 'development') return '123456';

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
};