const express = require('express')
const router = express.Router()
const upload = require('../middlewares/post');
const {createPost, updatePost} = require('../controllers/postController');
const { verifyJWT, jwtVerifier } = require('../middlewares/verifyJWT');


//router for creating a new post
router.post('/posts', verifyJWT(jwtVerifier), upload.array('media', 10), createPost);

//route to update the post
router.patch('/posts/:postId', verifyJWT(jwtVerifier), updatePost);


module.exports = router