const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const authenticate = require('../middleware/auth');

router.get('/overview', authenticate, dashboardController.getDashboardOverview);

module.exports = router;
