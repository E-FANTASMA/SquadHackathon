const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Company Auth
router.post('/company/signup', authController.companySignup);
router.post('/company/login', authController.login); // Reusing universal login

// Worker Auth
router.post('/worker/signup', authController.workerSignup);
router.post('/worker/login', authController.login); // Reusing universal login

module.exports = router;
