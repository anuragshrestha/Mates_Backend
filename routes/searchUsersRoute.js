const {searchName} = require('../controllers/searchUsersController');
const express = require('express');
const router = express.Router();


router.get('/users/search', searchName);

module.exports = router

