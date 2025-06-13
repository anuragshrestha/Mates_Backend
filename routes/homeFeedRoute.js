const express = require('express')
const router = express.Router();
const {verifyJWT, jwtVerifier} = require('../middlewares/verifyJWT');
const {getFeed} = require('../controllers/homeFeedController');


router.get('/home-feed', verifyJWT(jwtVerifier), getFeed);

module.exports = router;