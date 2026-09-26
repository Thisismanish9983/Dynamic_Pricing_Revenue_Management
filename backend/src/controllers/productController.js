const { Product, AuditLog, Organization } = require('../../../database/models');
const { calculateProductPrice } = require('../services/pricingEngine');
const { PricingRule } = require('../../../database/models');

/**
 * Get all products for the authenticated tenant
 */
exports.getProducts = async (req, res) => {
  try {
    const orgId = req.user.organizationId;
    const { category, status, search } = req.query;

    const query = { organizationId: orgId };

    if (category && category !== 'all') {
      query.category = category;
    }
    if (status && status !== 'all') {
      query.status = status;
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
      ];
    }

    const products = await Product.find(query).sort({ createdAt: -1 });

    // Compute summary KPIs
    const totalInventory = products.length;
    let totalCapacity = 0;
    let totalOccupied = 0;
    let totalRevenueRate = 0;

    products.forEach((p) => {
      totalCapacity += p.capacity || 0;
      totalOccupied += p.occupiedUnits || 0;
      totalRevenueRate += (p.currentPrice || p.basePrice) * (p.occupiedUnits || 0);
    });

    const averageOccupancy = totalCapacity > 0 ? Math.round((totalOccupied / totalCapacity) * 100) : 0;

    res.status(200).json({
      success: true,
      count: products.length,
      kpis: {
        totalInventory,
        totalCapacity,
        totalOccupied,
        averageOccupancy,
        totalRevenueRate: Math.round(totalRevenueRate),
      },
      products,
    });
  } catch (err) {
    console.error('[Product Controller Error]', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Get single product by ID
 */
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      organizationId: req.user.organizationId,
    });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.status(200).json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Create a new product
 */
exports.createProduct = async (req, res) => {
  try {
    const orgId = req.user.organizationId;
    const {
      name,
      category,
      description,
      basePrice,
      minPrice,
      maxPrice,
      capacity,
      occupiedUnits = 0,
      location,
      status = 'active',
    } = req.body;

    if (!name || !category || basePrice === undefined || minPrice === undefined || maxPrice === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Name, category, base price, min price, and max price limits are required.',
      });
    }

    if (Number(minPrice) > Number(basePrice) || Number(basePrice) > Number(maxPrice)) {
      return res.status(400).json({
        success: false,
        message: 'Pricing limits invalid: minPrice must be <= basePrice <= maxPrice.',
      });
    }

    const availableUnits = Math.max(0, (Number(capacity) || 1) - (Number(occupiedUnits) || 0));

    const product = await Product.create({
      organizationId: orgId,
      name,
      category,
      description: description || '',
      basePrice: Number(basePrice),
      minPrice: Number(minPrice),
      maxPrice: Number(maxPrice),
      currentPrice: Number(basePrice),
      capacity: Number(capacity) || 1,
      occupiedUnits: Number(occupiedUnits) || 0,
      availableUnits,
      location: location || 'Main Facility',
      status,
      pricingConfig: {
        demandMultiplier: 1.0,
        isDynamicPricingEnabled: true,
      },
    });

    // Audit log
    await AuditLog.create({
      organizationId: orgId,
      userId: req.user.id,
      action: 'PRODUCT_CREATED',
      entityType: 'Product',
      entityId: product._id,
      details: { name: product.name, basePrice: product.basePrice },
    });

    res.status(201).json({ success: true, product });
  } catch (err) {
    console.error('[Create Product Error]', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Update product
 */
exports.updateProduct = async (req, res) => {
  try {
    const orgId = req.user.organizationId;
    const product = await Product.findOne({ _id: req.params.id, organizationId: orgId });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const {
      name,
      category,
      description,
      basePrice,
      minPrice,
      maxPrice,
      currentPrice,
      capacity,
      occupiedUnits,
      location,
      status,
      pricingConfig,
    } = req.body;

    if (name !== undefined) product.name = name;
    if (category !== undefined) product.category = category;
    if (description !== undefined) product.description = description;
    if (basePrice !== undefined) product.basePrice = Number(basePrice);
    if (minPrice !== undefined) product.minPrice = Number(minPrice);
    if (maxPrice !== undefined) product.maxPrice = Number(maxPrice);
    if (currentPrice !== undefined) product.currentPrice = Number(currentPrice);
    if (location !== undefined) product.location = location;
    if (status !== undefined) product.status = status;
    if (pricingConfig !== undefined) product.pricingConfig = { ...product.pricingConfig, ...pricingConfig };

    if (capacity !== undefined) {
      product.capacity = Number(capacity);
    }
    if (occupiedUnits !== undefined) {
      product.occupiedUnits = Math.min(product.capacity, Math.max(0, Number(occupiedUnits)));
    }

    product.availableUnits = Math.max(0, product.capacity - product.occupiedUnits);

    // Validate boundaries
    if (product.minPrice > product.basePrice || product.basePrice > product.maxPrice) {
      return res.status(400).json({
        success: false,
        message: 'Invalid boundaries: minPrice must be <= basePrice <= maxPrice.',
      });
    }

    await product.save();

    await AuditLog.create({
      organizationId: orgId,
      userId: req.user.id,
      action: 'PRODUCT_UPDATED',
      entityType: 'Product',
      entityId: product._id,
      details: { name: product.name, currentPrice: product.currentPrice },
    });

    res.status(200).json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Quick Occupancy Adjustment (e.g. front desk check-in / check-out)
 */
exports.updateOccupancy = async (req, res) => {
  try {
    const orgId = req.user.organizationId;
    const product = await Product.findOne({ _id: req.params.id, organizationId: orgId });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const { occupiedUnits, change } = req.body;

    let newOccupied = product.occupiedUnits;
    if (change !== undefined) {
      newOccupied += Number(change);
    } else if (occupiedUnits !== undefined) {
      newOccupied = Number(occupiedUnits);
    }

    // Clamp between 0 and capacity
    newOccupied = Math.max(0, Math.min(product.capacity, newOccupied));
    product.occupiedUnits = newOccupied;
    product.availableUnits = Math.max(0, product.capacity - newOccupied);

    // Evaluate dynamic rules automatically if tenant settings allow
    const org = await Organization.findById(orgId);
    if (product.pricingConfig?.isDynamicPricingEnabled && org?.settings?.autoApproveRules) {
      const activeRules = await PricingRule.find({ organizationId: orgId, isActive: true });
      const calculation = calculateProductPrice(product, activeRules);
      product.currentPrice = calculation.recommendedPrice;
    }

    await product.save();

    await AuditLog.create({
      organizationId: orgId,
      userId: req.user.id,
      action: 'OCCUPANCY_ADJUSTED',
      entityType: 'Product',
      entityId: product._id,
      details: {
        occupiedUnits: product.occupiedUnits,
        occupancyRate: product.occupancyRate,
        currentPrice: product.currentPrice,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Occupancy updated successfully',
      product,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Delete product
 */
exports.deleteProduct = async (req, res) => {
  try {
    const orgId = req.user.organizationId;
    const product = await Product.findOneAndDelete({ _id: req.params.id, organizationId: orgId });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    await AuditLog.create({
      organizationId: orgId,
      userId: req.user.id,
      action: 'PRODUCT_DELETED',
      entityType: 'Product',
      entityId: product._id,
      details: { name: product.name },
    });

    res.status(200).json({ success: true, message: 'Product deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
