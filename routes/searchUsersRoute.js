/**
 * Route for searching other user in the search screen.
 */


const {searchName} = require('../controllers/searchUsersController');
const express = require('express');
const {jwtVerifier, verifyJWT} = require('../middlewares/verifyJWT');
const router = express.Router();


router.get('/users/search', verifyJWT(jwtVerifier), searchName);

module.exports = router

