const { Product, PricingRule, PriceRecommendation, AuditLog, Notification } = require('../../../database/models');
const { calculateProductPrice } = require('../services/pricingEngine');

/**
 * Get all rate recommendations with automatic upcoming schedule generation
 */
exports.getRecommendations = async (req, res) => {
  try {
    const orgId = req.user.organizationId;
    const { status = 'all', category } = req.query;

    const [products, rules] = await Promise.all([
      Product.find({ organizationId: orgId, status: 'active' }),
      PricingRule.find({ organizationId: orgId, isActive: true }),
    ]);

    // Check if recommendations exist for upcoming 7 days, if not generate them
    const existingCount = await PriceRecommendation.countDocuments({ organizationId: orgId });

    if (existingCount < 5 && products.length > 0) {
      const now = new Date();
      const generated = [];

      for (let i = 1; i <= 7; i++) {
        const targetDate = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
        const dateStr = targetDate.toISOString().split('T')[0];

        for (const product of products) {
          const calc = calculateProductPrice(product, rules, targetDate);

          if (calc.recommendedPrice !== product.basePrice || calc.triggeredRules.length > 0) {
            const reasons = calc.triggeredRules.map((r) => r.ruleName).join(' + ') || 'Demand Adjustment';

            generated.push({
              organizationId: orgId,
              productId: product._id,
              targetDate: dateStr,
              basePrice: product.basePrice,
              currentPrice: product.currentPrice,
              recommendedPrice: calc.recommendedPrice,
              occupancyRate: calc.occupancyRate,
              demandMultiplier: Math.round((calc.recommendedPrice / (product.basePrice || 1)) * 100) / 100,
              triggerReason: reasons,
              status: 'pending',
            });
          }
        }
      }

      if (generated.length > 0) {
        await PriceRecommendation.insertMany(generated);
      }
    }

    // Build query
    const query = { organizationId: orgId };
    if (status && status !== 'all') {
      query.status = status;
    }

    const recs = await PriceRecommendation.find(query)
      .populate('productId', 'name category minPrice maxPrice basePrice location')
      .populate('reviewedBy', 'name email role')
      .sort({ createdAt: -1 });

    // Optional category filter on populated product
    let filtered = recs;
    if (category && category !== 'all') {
      filtered = recs.filter((r) => r.productId && r.productId.category === category);
    }

    // Metrics summary
    const allTenantRecs = await PriceRecommendation.find({ organizationId: orgId });
    const pendingCount = allTenantRecs.filter((r) => r.status === 'pending').length;
    const approvedCount = allTenantRecs.filter((r) => r.status === 'approved').length;
    const rejectedCount = allTenantRecs.filter((r) => r.status === 'rejected').length;
    const overriddenCount = allTenantRecs.filter((r) => r.status === 'overridden').length;

    let projectedGainSum = 0;
    allTenantRecs.forEach((r) => {
      if (r.status === 'pending') {
        projectedGainSum += Math.max(0, r.recommendedPrice - r.currentPrice);
      }
    });

    res.status(200).json({
      success: true,
      count: filtered.length,
      metrics: {
        total: allTenantRecs.length,
        pendingCount,
        approvedCount,
        rejectedCount,
        overriddenCount,
        projectedPotentialLift: Math.round(projectedGainSum),
      },
      recommendations: filtered,
    });
  } catch (err) {
    console.error('[Recommendation Controller Error]', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Approve a single recommendation
 */
exports.approveRecommendation = async (req, res) => {
  try {
    const orgId = req.user.organizationId;
    const rec = await PriceRecommendation.findOne({ _id: req.params.id, organizationId: orgId });

    if (!rec) {
      return res.status(404).json({ success: false, message: 'Recommendation not found.' });
    }

    rec.status = 'approved';
    rec.reviewedBy = req.user.id;
    rec.reviewedAt = new Date();
    await rec.save();

    // Update product live rate
    const product = await Product.findById(rec.productId);
    if (product) {
      product.currentPrice = rec.recommendedPrice;
      await product.save();
    }

    // Audit log
    await AuditLog.create({
      organizationId: orgId,
      userId: req.user.id,
      action: 'PRICE_RECOMMENDATION_APPROVED',
      entityType: 'PriceRecommendation',
      entityId: rec._id,
      details: {
        productName: product?.name,
        targetDate: rec.targetDate,
        approvedRate: rec.recommendedPrice,
      },
    });

    res.status(200).json({
      success: true,
      message: `Recommendation for ${rec.targetDate} approved at $${rec.recommendedPrice}.`,
      recommendation: rec,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Override recommendation with custom price
 */
exports.overrideRecommendation = async (req, res) => {
  try {
    const orgId = req.user.organizationId;
    const { overridePrice, reviewNote } = req.body;

    const rec = await PriceRecommendation.findOne({ _id: req.params.id, organizationId: orgId });
    if (!rec) {
      return res.status(404).json({ success: false, message: 'Recommendation not found.' });
    }

    const product = await Product.findById(rec.productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const priceNum = Number(overridePrice);
    if (priceNum < product.minPrice || priceNum > product.maxPrice) {
      return res.status(400).json({
        success: false,
        message: `Guardrail violation: Price must stay between Min ($${product.minPrice}) and Max ($${product.maxPrice}).`,
      });
    }

    rec.status = 'overridden';
    rec.recommendedPrice = priceNum;
    rec.reviewNote = reviewNote || 'Manager custom adjusted rate';
    rec.reviewedBy = req.user.id;
    rec.reviewedAt = new Date();
    await rec.save();

    product.currentPrice = priceNum;
    await product.save();

    await AuditLog.create({
      organizationId: orgId,
      userId: req.user.id,
      action: 'PRICE_RECOMMENDATION_OVERRIDDEN',
      entityType: 'PriceRecommendation',
      entityId: rec._id,
      details: {
        productName: product.name,
        targetDate: rec.targetDate,
        customRate: priceNum,
        reason: rec.reviewNote,
      },
    });

    res.status(200).json({
      success: true,
      message: `Rate modified and approved at $${priceNum}.`,
      recommendation: rec,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Reject recommendation
 */
exports.rejectRecommendation = async (req, res) => {
  try {
    const orgId = req.user.organizationId;
    const { reviewNote } = req.body;

    const rec = await PriceRecommendation.findOne({ _id: req.params.id, organizationId: orgId });
    if (!rec) {
      return res.status(404).json({ success: false, message: 'Recommendation not found.' });
    }

    rec.status = 'rejected';
    rec.reviewNote = reviewNote || 'Rejected by Revenue Manager. Baseline price retained.';
    rec.reviewedBy = req.user.id;
    rec.reviewedAt = new Date();
    await rec.save();

    await AuditLog.create({
      organizationId: orgId,
      userId: req.user.id,
      action: 'PRICE_RECOMMENDATION_REJECTED',
      entityType: 'PriceRecommendation',
      entityId: rec._id,
      details: { targetDate: rec.targetDate, reason: rec.reviewNote },
    });

    res.status(200).json({
      success: true,
      message: 'Recommendation rejected. Baseline rate preserved.',
      recommendation: rec,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Batch approve all pending recommendations
 */
exports.batchApprove = async (req, res) => {
  try {
    const orgId = req.user.organizationId;
    const pendingRecs = await PriceRecommendation.find({
      organizationId: orgId,
      status: 'pending',
    });

    if (pendingRecs.length === 0) {
      return res.status(200).json({ success: true, message: 'No pending recommendations to approve.' });
    }

    const now = new Date();
    for (const rec of pendingRecs) {
      rec.status = 'approved';
      rec.reviewedBy = req.user.id;
      rec.reviewedAt = now;
      await rec.save();

      await Product.findByIdAndUpdate(rec.productId, { currentPrice: rec.recommendedPrice });
    }

    await AuditLog.create({
      organizationId: orgId,
      userId: req.user.id,
      action: 'PRICE_RECOMMENDATIONS_BATCH_APPROVED',
      entityType: 'PriceRecommendation',
      details: { count: pendingRecs.length },
    });

    await Notification.create({
      organizationId: orgId,
      title: 'Batch Rate Approvals Applied',
      message: `Revenue Manager approved all ${pendingRecs.length} pending price recommendations.`,
      type: 'pending_approval',
      severity: 'medium',
      read: false,
    });

    res.status(200).json({
      success: true,
      message: `Successfully approved and deployed all ${pendingRecs.length} recommendations.`,
      approvedCount: pendingRecs.length,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Get decision history / audit trail
 */
exports.getDecisionHistory = async (req, res) => {
  try {
    const orgId = req.user.organizationId;
    const history = await AuditLog.find({
      organizationId: orgId,
      action: {
        $in: [
          'PRICE_RECOMMENDATION_APPROVED',
          'PRICE_RECOMMENDATION_OVERRIDDEN',
          'PRICE_RECOMMENDATION_REJECTED',
          'PRICE_RECOMMENDATIONS_BATCH_APPROVED',
          'PRICE_OVERRIDE_APPLIED',
          'PRICE_OVERRIDE_REMOVED',
        ],
      },
    })
      .populate('userId', 'name email role')
      .sort({ createdAt: -1 })
      .limit(30);

    res.status(200).json({ success: true, history });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
