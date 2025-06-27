const {searchName} = require('../controllers/searchUsersController');
const express = require('express');
const router = express.Router();


router.get('/search-user', searchName);

module.exports = router

