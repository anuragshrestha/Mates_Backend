const express = require('express');
const router = express.Router();
const {verifyJWT, jwtVerifier} = require('../middlewares/verifyJWT');
const {getUserInfo, updateUserProfile} = require('../controllers/accountController');
const {sendFeedback} = require("../controllers/feedbackController");
const {sendHelpEmail} = require("../controllers/helpSupportController");
const upload = require('../middlewares/uploadImage')



//route to get all the posts posted by the current user and its personal info
router.get('/account', verifyJWT(jwtVerifier), getUserInfo);


//route to update user profile data
router.put('/account/user-profile', verifyJWT(jwtVerifier), upload.single('image'), updateUserProfile);

//route to send feedback to the mates
router.post('/account/feedback', verifyJWT(jwtVerifier), sendFeedback);

router.post('/account/help-support', verifyJWT(jwtVerifier), sendHelpEmail);

module.exports = router;