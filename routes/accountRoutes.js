const express = require('express');
const router = express.Router();
const {verifyJWT, jwtVerifier} = require('../middlewares/verifyJWT');
const {getUserPost, updateUserProfile} = require('../controllers/accountController');
const upload = require('../middlewares/uploadImage')



//route to get user post
router.get('/account/posts', verifyJWT(jwtVerifier), getUserPost);


//route rto update user profile data
router.put('/account/user-profile', verifyJWT(jwtVerifier), upload.single('image'), updateUserProfile);


module.exports = router;