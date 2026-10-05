const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const noAuthMiddleware = require("../middleware/no-auth.middleware");

router.post('/login', authController.login);
router.post('/signup', authController.signup);
router.post('/verify-otp', authController.verifyOtp);
router.get('/direct-login', authController.directLoginLink);
router.get('/auth/direct-login', authController.directLoginLink);
router.post('/verify-2fa-code', noAuthMiddleware, authController.postVerify2FACode);
router.post('/account-recovery', authController.accountRecovery);

module.exports = router;