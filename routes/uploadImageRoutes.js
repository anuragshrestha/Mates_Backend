const express = require('express');
const router = express.Router();
const upload = require('../middlewares/uploadProfile');
const authenticateToken = require('../middlewares/authMiddleware');
const profileContoller = require('../controllers/uploadProfileController');


router.post('/upload-profile-image', authenticateToken, upload.single('image'), profileContoller.uploadProfileImage);

module.exports = router;
