const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const userController = require('../controllers/user.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Multer storage config — save profile photos to public/uploads/profiles/
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '..', 'public', 'uploads', 'profiles'));
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname).toLowerCase();
        const uniqueName = `profile_${req.session?.user?._id}_${Date.now()}${ext}`;
        cb(null, uniqueName);
    },
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed (jpg, png, webp, gif).'), false);
    };
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
});

router.get('/', authMiddleware, userController.getDashboardPage);

router.post('/profile/update', authMiddleware, upload.single('profilePhoto'), userController.updateProfile);

router.post('/sign-out', authMiddleware, userController.postSignOut);

module.exports = router;