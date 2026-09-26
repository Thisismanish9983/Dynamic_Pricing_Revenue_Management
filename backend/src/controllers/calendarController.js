const { Product, PricingRule, PriceOverride, AuditLog } = require('../../../database/models');
const { calculateProductPrice } = require('../services/pricingEngine');

/**
 * Get calendar matrix for specified month and optional category
 */
exports.getCalendarMatrix = async (req, res) => {
  try {
    const orgId = req.user.organizationId;
    const { month, category } = req.query;

    // Determine target year & month (e.g. "2026-09")
    let targetYear, targetMonth;
    if (month && /^\d{4}-\d{2}$/.test(month)) {
      const parts = month.split('-');
      targetYear = parseInt(parts[0], 10);
      targetMonth = parseInt(parts[1], 10) - 1; // 0-indexed
    } else {
      const now = new Date();
      targetYear = now.getFullYear();
      targetMonth = now.getMonth();
    }

    const firstDay = new Date(targetYear, targetMonth, 1);
    const lastDay = new Date(targetYear, targetMonth + 1, 0);
    const totalDays = lastDay.getDate();

    // Query active products for this tenant
    const productQuery = { organizationId: orgId, status: 'active' };
    if (category && category !== 'all') {
      productQuery.category = category;
    }
    const products = await Product.find(productQuery);

    // Query active pricing rules
    const rules = await PricingRule.find({ organizationId: orgId, isActive: true });

    // Format start/end strings
    const pad = (n) => String(n).padStart(2, '0');
    const startStr = `${targetYear}-${pad(targetMonth + 1)}-01`;
    const endStr = `${targetYear}-${pad(targetMonth + 1)}-${pad(totalDays)}`;

    // Query overrides for this month
    const overrides = await PriceOverride.find({
      organizationId: orgId,
      status: 'active',
      date: { $gte: startStr, $lte: endStr },
    });

    const overrideMap = {};
    overrides.forEach((ov) => {
      const key = `${ov.productId.toString()}_${ov.date}`;
      overrideMap[key] = ov;
    });

    // Build day-by-day calendar data
    const days = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    for (let d = 1; d <= totalDays; d++) {
      const dayDate = new Date(targetYear, targetMonth, d);
      const dateStr = `${targetYear}-${pad(targetMonth + 1)}-${pad(d)}`;
      const dayOfWeekNum = dayDate.getDay();
      const isWeekend = dayOfWeekNum === 0 || dayOfWeekNum === 5 || dayOfWeekNum === 6; // Fri, Sat, Sun

      const productRates = products.map((product) => {
        // Calculate dynamic recommended price
        const calc = calculateProductPrice(product, rules, dayDate);
        const override = overrideMap[`${product._id.toString()}_${dateStr}`];

        // Day specific occupancy simulation based on baseline
        let dayOccupancy = calc.occupancyRate;
        if (isWeekend) {
          dayOccupancy = Math.min(100, Math.round(dayOccupancy * 1.2));
        } else if (dayOfWeekNum === 2 || dayOfWeekNum === 3) {
          dayOccupancy = Math.max(10, Math.round(dayOccupancy * 0.85));
        }

        const finalPrice = override ? override.overridePrice : calc.recommendedPrice;

        let demandLevel = 'normal';
        if (dayOccupancy >= 80 || finalPrice >= product.basePrice * 1.25) {
          demandLevel = 'surge';
        } else if (dayOccupancy >= 65 || finalPrice > product.basePrice) {
          demandLevel = 'high';
        } else if (dayOccupancy <= 35) {
          demandLevel = 'low';
        }

        return {
          productId: product._id,
          productName: product.name,
          category: product.category,
          basePrice: product.basePrice,
          minPrice: product.minPrice,
          maxPrice: product.maxPrice,
          recommendedPrice: calc.recommendedPrice,
          overridePrice: override ? override.overridePrice : null,
          overrideReason: override ? override.reason : null,
          overrideId: override ? override._id : null,
          finalPrice,
          occupancyRate: dayOccupancy,
          demandLevel,
          triggeredRulesCount: calc.triggeredRules.length,
          wasClamped: calc.wasClamped,
        };
      });

      days.push({
        dayNumber: d,
        date: dateStr,
        dayOfWeek: dayNames[dayOfWeekNum],
        isWeekend,
        rates: productRates,
      });
    }

    res.status(200).json({
      success: true,
      month: `${targetYear}-${pad(targetMonth + 1)}`,
      monthName: firstDay.toLocaleString('default', { month: 'long', year: 'numeric' }),
      totalDays,
      productsCount: products.length,
      days,
    });
  } catch (err) {
    console.error('[Calendar Controller Error]', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Create or update a manual price override for a specific product and date
 */
exports.createOverride = async (req, res) => {
  try {
    const orgId = req.user.organizationId;
    const { productId, date, overridePrice, reason } = req.body;

    if (!productId || !date || overridePrice === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Product ID, target date, and override price are required.',
      });
    }

    const product = await Product.findOne({ _id: productId, organizationId: orgId });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const priceNum = Number(overridePrice);

    // Safeguard enforcement: manual overrides cannot violate floor or ceiling
    if (priceNum < product.minPrice || priceNum > product.maxPrice) {
      return res.status(400).json({
        success: false,
        message: `Override violates safeguards! Rate must remain between Min ($${product.minPrice}) and Max ($${product.maxPrice}).`,
      });
    }

    const override = await PriceOverride.findOneAndUpdate(
      { organizationId: orgId, productId, date },
      {
        overridePrice: priceNum,
        originalPrice: product.basePrice,
        recommendedPrice: product.currentPrice,
        reason: reason || 'Manual Revenue Manager override',
        status: 'active',
        createdBy: req.user.id,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Create Audit Log
    await AuditLog.create({
      organizationId: orgId,
      userId: req.user.id,
      action: 'PRICE_OVERRIDE_APPLIED',
      entityType: 'PriceOverride',
      entityId: override._id,
      details: {
        productName: product.name,
        date,
        overridePrice: priceNum,
        reason: override.reason,
      },
    });

    res.status(200).json({
      success: true,
      message: `Manual override of $${priceNum} applied successfully for ${date}.`,
      override,
    });
  } catch (err) {
    console.error('[Create Override Error]', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Delete a price override
 */
exports.deleteOverride = async (req, res) => {
  try {
    const orgId = req.user.organizationId;
    const { id } = req.params;

    const override = await PriceOverride.findOneAndDelete({ _id: id, organizationId: orgId });
    if (!override) {
      return res.status(404).json({ success: false, message: 'Price override not found.' });
    }

    await AuditLog.create({
      organizationId: orgId,
      userId: req.user.id,
      action: 'PRICE_OVERRIDE_REMOVED',
      entityType: 'PriceOverride',
      entityId: override._id,
      details: { date: override.date, overridePrice: override.overridePrice },
    });

    res.status(200).json({
      success: true,
      message: 'Price override removed successfully. Returned to algorithmic rate.',
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
