const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authenticate = require('../middleware/auth');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', authenticate, authController.getMe);
router.get('/demo-accounts', authController.getDemoAccounts);
router.post('/seed-demo', authController.seedDemoDatabase);

module.exports = router;
