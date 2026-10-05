const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const authMiddleware = require('../middleware/auth.middleware');

router.get('/', authMiddleware, userController.getDashboardPage);
router.post('/sign-out', authMiddleware, userController.postSignOut);

module.exports = router;