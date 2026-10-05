'use strict';

const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const constants = require('../../config/constant');
const User = require('../../models/user.model');

class General {
    success_res = (msg = "", data = {}) => {
        var res = { flag: 1 };
        res.msg = msg;
        res.data = data;
        return res;
    };

    invalid_token = (msg = "", data = {}) => {
        var res = { flag: 4 };
        res.msg = msg;
        res.data = data;
        return res;
    };

    error_res = (msg = "", data = {}) => {
        var res = { flag: 0 };
        res.msg = msg.length == 0 ? "Error" : msg;
        res.data = data;
        return res;
    };

    auth_error = (msg = "", data = {}) => {
        var res = { flag: 8 };
        res.msg = msg.length == 0 ? "Unauthorized Token" : msg;
        res.data = data;
        return res;
    };

    session_expired = (msg = "", data = {}) => {
        var res = { flag: 8 };
        res.msg = msg.length == 0 ? "Unauthorized Token" : msg;
        res.data = data;
        return res;
    };

    log1 = (msg) => {
        const d = new Date();
        console.log("[" + d.toLocaleString() + " " + d.getMilliseconds() + "] :", msg);
    };

    isValidIp = (ip) => {
        const ipAddressRegex = /^(\d{1,3}\.){3}(\d{1,3})$/;
        return ipAddressRegex.test(ip);
    };

    getIp = (req) => {
        const ip = req.headers['cf-connecting-ip'] ? req.headers['cf-connecting-ip'] : req.connection.remoteAddress;
        const parts = ip.split('::ffff:');
        return parts.length > 1 ? parts[1] : parts[0];
    };

    validation_res = (msg = "", data = {}) => {
        var res = { flag: 2 };
        res.msg = msg.length == 0 ? "Validation Error" : msg;
        res.data = data;
        return res;
    };

    generateRandomToken = (length) => {
        let result = '';
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return result;
    };

    generateOtp = (length = 6) => {

        if (process.env.NODE_ENV === 'local') return '123456';

        let result = '';
        const characters = '0123456789';
        for (let i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return result;
    };

    generateUniqueMemo = async () => {
        while (true) {
            try {
                const memo = crypto.randomInt(10000000, 100000000).toString();

                const existingMemo = await User.exists({ memo });

                if (!existingMemo) {
                    return memo;
                };

            } catch (error) {
                this.log1(["Error in generateUniqueMemo----->", error]);
                throw error;
            };
        };
    };

    generateAuthToken = async (payload) => {
        try {
            const token = jwt.sign(payload, process.env.AUTH_SECRET);

            return token;
        } catch (error) {
            this.log1(["Error in generateAuthToken ----->", error]);
            return null;
        };
    };

    encryptText = async (text) => {
        try {
            const ciphering = process.env.CIPHERING;
            const secret_key = process.env.SECRET_KEY;
            const encryption_iv = process.env.ENCRYPTION_IV;

            const encryptor = crypto.createCipheriv(ciphering, secret_key, encryption_iv);
            const encrypted = encryptor.update(text, 'utf8', 'base64') + encryptor.final('base64');

            return encrypted;
        } catch (error) {
            this.log1(["Error in encryptText ----->", error]);
            return null;
        };
    };

    decryptCipher = async (cipher) => {
        try {
            const ciphering = process.env.CIPHERING;
            const secret_key = process.env.SECRET_KEY;
            const encryption_iv = process.env.ENCRYPTION_IV;

            const decryptor = crypto.createDecipheriv(ciphering, secret_key, encryption_iv);
            const decrypted = decryptor.update(cipher, 'base64', 'utf8') + decryptor.final('utf8');

            return decrypted;
        } catch (error) {
            this.log1(["Error in decryptCipher ----->", error]);
            return null;
        };
    };
}

module.exports = new General();