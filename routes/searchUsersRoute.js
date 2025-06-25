const {searchName} = require('../controllers/searchUsersController');
const express = require('express');
const router = express.Router();


router.get('/search-users', searchName);

module.exports = router

