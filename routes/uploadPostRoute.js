const express = require('express')
const router = express.Router()
const upload = require('../middlewares/uploadPost');
const {createPost} = require('../controllers/uploadPostController');
const { verifyJWT, jwtVerifier } = require('../middlewares/verifyJWT');


//router for creating a new post
router.post('/create-post', verifyJWT(jwtVerifier), upload.single('image'), createPost);

module.exports = router