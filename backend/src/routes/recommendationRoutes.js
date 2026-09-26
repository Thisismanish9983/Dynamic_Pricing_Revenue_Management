const express = require('express');
const router = express.Router();
const recommendationController = require('../controllers/recommendationController');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/rbac');

router.use(authenticate);

// View recommendations & decision history
router.get('/', recommendationController.getRecommendations);
router.get('/history', recommendationController.getDecisionHistory);

// Approvals and overrides require Revenue Manager or Admin
router.post(
  '/:id/approve',
  authorize('admin', 'revenue_manager'),
  recommendationController.approveRecommendation
);

router.post(
  '/:id/override',
  authorize('admin', 'revenue_manager'),
  recommendationController.overrideRecommendation
);

router.post(
  '/:id/reject',
  authorize('admin', 'revenue_manager'),
  recommendationController.rejectRecommendation
);

router.post(
  '/batch-approve',
  authorize('admin', 'revenue_manager'),
  recommendationController.batchApprove
);

module.exports = router;
