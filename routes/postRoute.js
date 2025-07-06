const express = require('express')
const router = express.Router()
const upload = require('../middlewares/post');
const {createPost, updatePost, deletePost} = require('../controllers/postController');
const { verifyJWT, jwtVerifier } = require('../middlewares/verifyJWT');


//router for creating a new post
router.post('/posts', verifyJWT(jwtVerifier), upload.array('media', 10), createPost);

//route to update the post with postId
router.patch('/posts/:postId', verifyJWT(jwtVerifier), updatePost);

//route for deleting the post with :postId
router.delete('/posts/:postId', verifyJWT(jwtVerifier), deletePost);

module.exports = router