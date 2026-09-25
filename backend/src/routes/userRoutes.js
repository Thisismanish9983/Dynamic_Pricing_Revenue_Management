const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/rbac');

router.get('/', authenticate, authorize('admin', 'revenue_manager'), userController.getUsers);
router.post('/', authenticate, authorize('admin'), userController.createUser);
router.put('/:id', authenticate, authorize('admin'), userController.updateUser);

module.exports = router;
