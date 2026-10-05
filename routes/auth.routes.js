const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middleware/auth.middleware');

router.get('/login', authController.getLoginPage);
router.post('/login', authController.login);

router.get('/signup', authController.getSignupPage);
router.post('/signup', authController.signup);

router.get('/verify-otp', authController.getVerifyOtpPage);
router.post('/verify-otp', authController.verifyOtp);

router.get('/auth/direct-login', authController.directLoginLink);

module.exports = router;