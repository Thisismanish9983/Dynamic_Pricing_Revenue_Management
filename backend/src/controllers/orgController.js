const { Organization, AuditLog } = require('../../../database/models');

// @desc Get current organization details
// @route GET /api/organizations/current
exports.getCurrentOrganization = async (req, res) => {
  try {
    const org = await Organization.findById(req.organizationId);
    if (!org) {
      return res.status(404).json({ success: false, message: 'Organization not found' });
    }
    return res.status(200).json({ success: true, organization: org });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Update organization settings
// @route PUT /api/organizations/current/settings
exports.updateOrganizationSettings = async (req, res) => {
  try {
    const { name, industry, currency, timezone, settings } = req.body;

    const org = await Organization.findById(req.organizationId);
    if (!org) {
      return res.status(404).json({ success: false, message: 'Organization not found' });
    }

    if (name) org.name = name;
    if (industry) org.industry = industry;
    if (currency) org.currency = currency;
    if (timezone) org.timezone = timezone;
    if (settings) {
      org.settings = { ...org.settings, ...settings };
    }

    await org.save();

    await AuditLog.create({
      organizationId: req.organizationId,
      userId: req.user._id,
      action: 'ORG_SETTINGS_UPDATED',
      entityType: 'Organization',
      entityId: org._id,
      details: { updatedFields: req.body },
    });

    return res.status(200).json({
      success: true,
      message: 'Organization settings updated successfully',
      organization: org,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc List available tenants/organizations in system (for admin/demo multi-tenant switcher)
// @route GET /api/organizations
exports.listOrganizations = async (req, res) => {
  try {
    const orgs = await Organization.find({ isActive: true }).select('name slug industry currency');
    return res.status(200).json({ success: true, count: orgs.length, organizations: orgs });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
