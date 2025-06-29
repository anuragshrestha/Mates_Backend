const express = require('express');
const router = express.Router();
const {follow, unfollow} = require('../controllers/followController');
const {verifyJWT, jwtVerifier} = require('../middlewares/verifyJWT');


//route to follow user
router.post('/users/:targetUserId/follow', verifyJWT(jwtVerifier), follow);


//route to unfollow user
router.delete('/users/:targetUserId/follow', verifyJWT(jwtVerifier), unfollow)


module.exports = router;


