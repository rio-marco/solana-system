const nodemailer = require('nodemailer');
const Generallib = require('../utils/lib/general.lib');

const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: process.env.MAIL_PORT,
    secure: process.env.MAIL_PORT == 465, // true for 465, false for other ports
    auth: {
        user: process.env.MAIL_USERNAME,
        pass: process.env.MAIL_PASSWORD,
    },
});

const sendMail = async (mailOptions) => {
    return new Promise((resolve, reject) => {
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                Generallib.log1(["[MailService] Error sending email------->", error]);
                reject(error);
            } else {
                Generallib.log1(["[MailService] Email sent successfully:", info.response]);
                resolve(info);
            };
        });
    });
};

module.exports = {
    sendMail,
};
