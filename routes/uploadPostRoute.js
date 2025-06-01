const express = require('express')
const router = express.Router()
const verifyJWT = require('../middlewares/verifyJWT');
const upload = require('../middlewares/uploadPost');
const uploadController = require('../controllers/uploadPostController');


//router for creating a new post
router.post('/post', verifyJWT, upload.single('image'), uploadController.createPost);