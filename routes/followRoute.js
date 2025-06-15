const express = require('express');
const router = express.Router();
const {follow} = require('../controllers/followController');
const {verifyJWT, jwtVerifier} = require('../middlewares/verifyJWT');


//route to follow user
router.post('/follow', verifyJWT(jwtVerifier), follow);

module.exports = router;
