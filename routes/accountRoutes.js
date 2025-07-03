const express = require('express');
const router = express.Router();
const {verifyJwt, jwtVerifier} = require('../middlewares/verifyJWT');
const {getUserPost} = require('../controllers/accountController');


//route to get user post
router.get('/account/posts', verifyJwt(jwtVerifier), getUserPost);