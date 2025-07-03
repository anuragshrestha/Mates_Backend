const express = require('express');
const router = express.Router();
const {verifyJWT, jwtVerifier} = require('../middlewares/verifyJWT');
const {getUserPost} = require('../controllers/accountController');


//route to get user post
router.get('/account/posts', verifyJWT(jwtVerifier), getUserPost);

module.exports = router;