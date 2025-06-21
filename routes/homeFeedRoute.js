const express = require('express')
const router = express.Router();
const {verifyJWT, jwtVerifier} = require('../middlewares/verifyJWT');
const {getFeed, likePost, unLikePost} = require('../controllers/homeFeedController');


//route to fetch posts for Around you Screen
router.get('/aroundyou-feed', verifyJWT(jwtVerifier), getFeed);

//route to like a post
router.post('/like-post',verifyJWT(jwtVerifier), likePost);


//route to unlike a post
router.delete('/unlike-post', verifyJWT(jwtVerifier), unLikePost);




module.exports = router;