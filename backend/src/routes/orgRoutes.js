const express = require('express');
const router = express.Router();
const orgController = require('../controllers/orgController');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/rbac');

router.get('/current', authenticate, orgController.getCurrentOrganization);
router.put('/current/settings', authenticate, authorize('admin'), orgController.updateOrganizationSettings);
router.get('/', authenticate, orgController.listOrganizations);

module.exports = router;
