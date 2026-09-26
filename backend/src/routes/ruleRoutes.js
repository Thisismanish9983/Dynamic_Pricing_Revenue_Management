const express = require('express');
const router = express.Router();
const ruleController = require('../controllers/ruleController');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/rbac');

// All rule routes require valid tenant JWT
router.use(authenticate);

// Read rules & simulation (all authenticated tenant roles can inspect)
router.get('/', ruleController.getRules);
router.get('/simulate', ruleController.simulateRules);
router.get('/:id', ruleController.getRuleById);

// Admin & Revenue Manager can modify rules and execute rate deployments
router.post(
  '/',
  authorize('admin', 'revenue_manager'),
  ruleController.createRule
);

router.post(
  '/apply',
  authorize('admin', 'revenue_manager'),
  ruleController.applyRules
);

router.put(
  '/:id',
  authorize('admin', 'revenue_manager'),
  ruleController.updateRule
);

router.patch(
  '/:id/toggle',
  authorize('admin', 'revenue_manager'),
  ruleController.toggleRule
);

router.delete(
  '/:id',
  authorize('admin', 'revenue_manager'),
  ruleController.deleteRule
);

module.exports = router;
