const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth');

router.put('/signup', authController.signUp);


module.exports = router;