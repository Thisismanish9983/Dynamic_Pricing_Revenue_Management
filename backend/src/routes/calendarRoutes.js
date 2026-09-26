const express = require('express');
const router = express.Router();
const calendarController = require('../controllers/calendarController');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/rbac');

router.use(authenticate);

// View calendar matrix (all authenticated tenant roles can view)
router.get('/', calendarController.getCalendarMatrix);

// Only Revenue Manager & Admin can apply or delete manual overrides
router.post(
  '/override',
  authorize('admin', 'revenue_manager'),
  calendarController.createOverride
);

router.delete(
  '/override/:id',
  authorize('admin', 'revenue_manager'),
  calendarController.deleteOverride
);

module.exports = router;
