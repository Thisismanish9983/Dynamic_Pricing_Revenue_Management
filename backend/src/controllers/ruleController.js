const { PricingRule, Product, AuditLog, Notification } = require('../../../database/models');
const { calculateProductPrice } = require('../services/pricingEngine');

/**
 * Get all pricing rules for the authenticated tenant
 */
exports.getRules = async (req, res) => {
  try {
    const orgId = req.user.organizationId;
    const rules = await PricingRule.find({ organizationId: orgId }).sort({ priority: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: rules.length,
      rules,
    });
  } catch (err) {
    console.error('[Rules Controller Error]', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Get single rule by ID
 */
exports.getRuleById = async (req, res) => {
  try {
    const rule = await PricingRule.findOne({
      _id: req.params.id,
      organizationId: req.user.organizationId,
    });

    if (!rule) {
      return res.status(404).json({ success: false, message: 'Pricing rule not found' });
    }

    res.status(200).json({ success: true, rule });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Create a new pricing rule
 */
exports.createRule = async (req, res) => {
  try {
    const orgId = req.user.organizationId;
    const {
      name,
      description,
      ruleType = 'occupancy',
      conditions,
      action,
      targetScope,
      priority = 1,
      isActive = true,
      enforceClamping = true,
    } = req.body;

    if (!name || !action?.adjustmentValue) {
      return res.status(400).json({
        success: false,
        message: 'Rule name and adjustment action value are required.',
      });
    }

    const rule = await PricingRule.create({
      organizationId: orgId,
      name,
      description: description || '',
      ruleType,
      conditions: conditions || {},
      action: {
        adjustmentType: action.adjustmentType || 'percentage_increase',
        adjustmentValue: Number(action.adjustmentValue),
      },
      targetScope: targetScope || { applyToAll: true },
      priority: Number(priority) || 1,
      isActive: isActive !== false,
      enforceClamping: enforceClamping !== false,
      createdBy: req.user.id,
    });

    await AuditLog.create({
      organizationId: orgId,
      userId: req.user.id,
      action: 'PRICING_RULE_CREATED',
      entityType: 'PricingRule',
      entityId: rule._id,
      details: { name: rule.name, ruleType: rule.ruleType },
    });

    res.status(201).json({ success: true, rule });
  } catch (err) {
    console.error('[Create Rule Error]', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Update an existing pricing rule
 */
exports.updateRule = async (req, res) => {
  try {
    const orgId = req.user.organizationId;
    const rule = await PricingRule.findOne({ _id: req.params.id, organizationId: orgId });

    if (!rule) {
      return res.status(404).json({ success: false, message: 'Pricing rule not found' });
    }

    const {
      name,
      description,
      ruleType,
      conditions,
      action,
      targetScope,
      priority,
      isActive,
      enforceClamping,
    } = req.body;

    if (name !== undefined) rule.name = name;
    if (description !== undefined) rule.description = description;
    if (ruleType !== undefined) rule.ruleType = ruleType;
    if (conditions !== undefined) rule.conditions = { ...rule.conditions, ...conditions };
    if (action !== undefined) rule.action = { ...rule.action, ...action };
    if (targetScope !== undefined) rule.targetScope = { ...rule.targetScope, ...targetScope };
    if (priority !== undefined) rule.priority = Number(priority);
    if (isActive !== undefined) rule.isActive = isActive;
    if (enforceClamping !== undefined) rule.enforceClamping = enforceClamping;

    await rule.save();

    await AuditLog.create({
      organizationId: orgId,
      userId: req.user.id,
      action: 'PRICING_RULE_UPDATED',
      entityType: 'PricingRule',
      entityId: rule._id,
      details: { name: rule.name, isActive: rule.isActive },
    });

    res.status(200).json({ success: true, rule });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Toggle rule active status
 */
exports.toggleRule = async (req, res) => {
  try {
    const orgId = req.user.organizationId;
    const rule = await PricingRule.findOne({ _id: req.params.id, organizationId: orgId });

    if (!rule) {
      return res.status(404).json({ success: false, message: 'Pricing rule not found' });
    }

    rule.isActive = !rule.isActive;
    await rule.save();

    await AuditLog.create({
      organizationId: orgId,
      userId: req.user.id,
      action: 'PRICING_RULE_TOGGLED',
      entityType: 'PricingRule',
      entityId: rule._id,
      details: { name: rule.name, isActive: rule.isActive },
    });

    res.status(200).json({ success: true, rule });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Delete pricing rule
 */
exports.deleteRule = async (req, res) => {
  try {
    const orgId = req.user.organizationId;
    const rule = await PricingRule.findOneAndDelete({ _id: req.params.id, organizationId: orgId });

    if (!rule) {
      return res.status(404).json({ success: false, message: 'Pricing rule not found' });
    }

    await AuditLog.create({
      organizationId: orgId,
      userId: req.user.id,
      action: 'PRICING_RULE_DELETED',
      entityType: 'PricingRule',
      entityId: rule._id,
      details: { name: rule.name },
    });

    res.status(200).json({ success: true, message: 'Rule deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Simulate rules calculation across all inventory
 */
exports.simulateRules = async (req, res) => {
  try {
    const orgId = req.user.organizationId;
    const targetDate = req.query.date ? new Date(req.query.date) : new Date();

    const [products, rules] = await Promise.all([
      Product.find({ organizationId: orgId, status: 'active' }),
      PricingRule.find({ organizationId: orgId, isActive: true }),
    ]);

    const results = products.map((product) => calculateProductPrice(product, rules, targetDate));

    // Summary calculations
    let totalBaseRevenue = 0;
    let totalSimulatedRevenue = 0;
    let totalTriggeredAdjustments = 0;

    results.forEach((r) => {
      totalBaseRevenue += r.basePrice * r.occupiedUnits;
      totalSimulatedRevenue += r.recommendedPrice * r.occupiedUnits;
      if (r.triggeredRules.length > 0) totalTriggeredAdjustments++;
    });

    const projectedLift =
      totalBaseRevenue > 0
        ? Math.round(((totalSimulatedRevenue - totalBaseRevenue) / totalBaseRevenue) * 1000) / 10
        : 0;

    res.status(200).json({
      success: true,
      simulationMeta: {
        targetDate,
        totalActiveRules: rules.length,
        evaluatedProducts: products.length,
        totalTriggeredAdjustments,
        totalBaseRevenue: Math.round(totalBaseRevenue),
        totalSimulatedRevenue: Math.round(totalSimulatedRevenue),
        projectedRevenueLiftPercentage: projectedLift,
      },
      results,
    });
  } catch (err) {
    console.error('[Simulate Rules Error]', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Apply evaluated prices to live product inventory
 */
exports.applyRules = async (req, res) => {
  try {
    const orgId = req.user.organizationId;
    const targetDate = new Date();

    const [products, rules] = await Promise.all([
      Product.find({ organizationId: orgId, status: 'active' }),
      PricingRule.find({ organizationId: orgId, isActive: true }),
    ]);

    let updatedCount = 0;

    for (const product of products) {
      if (product.pricingConfig?.isDynamicPricingEnabled) {
        const calc = calculateProductPrice(product, rules, targetDate);
        if (product.currentPrice !== calc.recommendedPrice) {
          product.currentPrice = calc.recommendedPrice;
          await product.save();
          updatedCount++;
        }
      }
    }

    await AuditLog.create({
      organizationId: orgId,
      userId: req.user.id,
      action: 'RULES_EVALUATION_APPLIED',
      entityType: 'PricingRule',
      details: {
        updatedProductsCount: updatedCount,
        evaluatedRulesCount: rules.length,
      },
    });

    await Notification.create({
      organizationId: orgId,
      title: 'Pricing Rules Applied',
      message: `Dynamic rates updated for ${updatedCount} products based on current demand rules.`,
      type: 'rule_applied',
      severity: 'medium',
      read: false,
    });

    res.status(200).json({
      success: true,
      message: `Successfully evaluated and applied rates to ${updatedCount} products.`,
      updatedCount,
    });
  } catch (err) {
    console.error('[Apply Rules Error]', err);
    res.status(500).json({ success: false, message: err.message });
  }
};
