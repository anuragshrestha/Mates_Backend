/**
 * Route for viewing another user's profile
 * Includes followers/following counts, post count, posts, and follow status
 */


const express = require('express')
const router = express.Router();
const {verifyJWT, jwtVerifier} = require('../middlewares/verifyJWT');
const {getUserData} = require('../controllers/userProfileController');


router.get('/users/:targetUserId/profile', verifyJWT(jwtVerifier), getUserData);


module.exports = router