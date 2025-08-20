const express = require('express')
const router = express.Router();
const {verifyJWT, jwtVerifier} = require('../middlewares/verifyJWT');
const {getAroundYouFeed, getForYouFeed, likePost, unLikePost} = require('../controllers/homeFeedController');
const { route } = require('./authRoutes');


//route to fetch posts for Around you Screen
router.get('/feeds/aroundyou', verifyJWT(jwtVerifier), getAroundYouFeed);


//route to fetch posts for For you Screen
router.get('/feeds/foryou', verifyJWT(jwtVerifier), getForYouFeed);

//route to like a post
router.post('/posts/:postId/like',verifyJWT(jwtVerifier), likePost);

//route to unlike a post
router.delete('/posts/:postId/like', verifyJWT(jwtVerifier), unLikePost);




module.exports = router;