const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });
const mongoose = require('mongoose');
const connectDB = require('./connection');
const {
  Organization,
  User,
  Product,
  PricingRule,
  PriceOverride,
  PriceRecommendation,
  AuditLog,
  Notification,
} = require('./models');

const seedData = async () => {
  try {
    await connectDB(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/dynamic_pricing_db');
    console.log('[Database Seed] Starting database seeding...');

    // Clean existing data
    await Organization.deleteMany({});
    await User.deleteMany({});
    await Product.deleteMany({});
    await PricingRule.deleteMany({});
    await PriceOverride.deleteMany({});
    await PriceRecommendation.deleteMany({});
    await AuditLog.deleteMany({});
    await Notification.deleteMany({});

    console.log('[Database Seed] Cleared existing records.');

    // 1. Create Primary Organization: Grand Vista Boutique Hotel
    const hotelOrg = await Organization.create({
      name: 'Grand Vista Boutique Hotel',
      slug: 'grand-vista-hotel',
      industry: 'hotel',
      currency: 'USD',
      timezone: 'America/New_York',
      settings: {
        autoApproveRules: false,
        enableAnomalyAlerts: true,
        defaultMinPriceMargin: 0.7,
        defaultMaxPriceMargin: 1.8,
      },
    });

    // 2. Create Secondary Organization: Apex Event Spaces
    const venueOrg = await Organization.create({
      name: 'Apex Event Spaces & Venues',
      slug: 'apex-events',
      industry: 'event_venue',
      currency: 'USD',
      timezone: 'America/Los_Angeles',
      settings: {
        autoApproveRules: true,
        enableAnomalyAlerts: true,
        defaultMinPriceMargin: 0.75,
        defaultMaxPriceMargin: 2.0,
      },
    });

    // 3. Create Users for Grand Vista Hotel (covering all 4 RBAC roles)
    const adminUser = await User.create({
      name: 'Alex Johnson (Admin)',
      email: 'admin@grandvista.com',
      password: 'password123',
      role: 'admin',
      organizationId: hotelOrg._id,
      status: 'active',
    });

    const revenueManager = await User.create({
      name: 'Elena Rostova (Rev. Manager)',
      email: 'revenue@grandvista.com',
      password: 'password123',
      role: 'revenue_manager',
      organizationId: hotelOrg._id,
      status: 'active',
    });

    const staffUser = await User.create({
      name: 'Marcus Bell (Front Desk / Staff)',
      email: 'staff@grandvista.com',
      password: 'password123',
      role: 'staff',
      organizationId: hotelOrg._id,
      status: 'active',
    });

    const viewerUser = await User.create({
      name: 'Sarah Connor (Investor / Viewer)',
      email: 'viewer@grandvista.com',
      password: 'password123',
      role: 'viewer',
      organizationId: hotelOrg._id,
      status: 'active',
    });

    // Also create admin for Apex Event Spaces
    await User.create({
      name: 'David Apex',
      email: 'admin@apexevents.com',
      password: 'password123',
      role: 'admin',
      organizationId: venueOrg._id,
      status: 'active',
    });

    console.log('[Database Seed] Created organizations and RBAC users.');

    // 4. Create Products for Grand Vista Boutique Hotel
    const products = await Product.create([
      {
        organizationId: hotelOrg._id,
        name: 'Deluxe Ocean View King Room',
        category: 'Deluxe Rooms',
        description: 'Spacious ocean-facing room with private balcony and king size bed.',
        basePrice: 180,
        minPrice: 120,
        maxPrice: 320,
        currentPrice: 220, // dynamically adjusted for high demand
        capacity: 25,
        availableUnits: 4,
        occupiedUnits: 21,
        location: 'Wing A - Beachfront',
        status: 'active',
        pricingConfig: { demandMultiplier: 1.22, isDynamicPricingEnabled: true },
      },
      {
        organizationId: hotelOrg._id,
        name: 'Executive Penthouse Suite',
        category: 'Suites',
        description: 'Luxury top-floor suite with panoramic ocean views and private jacuzzi.',
        basePrice: 450,
        minPrice: 300,
        maxPrice: 850,
        currentPrice: 560,
        capacity: 5,
        availableUnits: 1,
        occupiedUnits: 4,
        location: '12th Floor Penthouse',
        status: 'active',
        pricingConfig: { demandMultiplier: 1.25, isDynamicPricingEnabled: true },
      },
      {
        organizationId: hotelOrg._id,
        name: 'Standard City Double Room',
        category: 'Standard Rooms',
        description: 'Cozy and modern room overlooking the city lights.',
        basePrice: 110,
        minPrice: 80,
        maxPrice: 200,
        currentPrice: 110,
        capacity: 40,
        availableUnits: 14,
        occupiedUnits: 26,
        location: 'Wing B - Courtyard',
        status: 'active',
        pricingConfig: { demandMultiplier: 1.0, isDynamicPricingEnabled: true },
      },
      {
        organizationId: hotelOrg._id,
        name: 'Garden Terrace Studio',
        category: 'Standard Rooms',
        description: 'Quiet studio overlooking the botanical gardens.',
        basePrice: 140,
        minPrice: 90,
        maxPrice: 240,
        currentPrice: 125, // discounted due to low occupancy
        capacity: 20,
        availableUnits: 15,
        occupiedUnits: 5,
        location: 'Wing C - Gardens',
        status: 'active',
        pricingConfig: { demandMultiplier: 0.9, isDynamicPricingEnabled: true },
      },
    ]);

    console.log(`[Database Seed] Seeded ${products.length} products.`);

    // 5. Seed Dynamic Pricing Rules for Grand Vista Boutique Hotel
    const pricingRules = await PricingRule.create([
      {
        organizationId: hotelOrg._id,
        name: 'High Occupancy Demand Surge',
        description: 'Automatically increases room rates by 15% when total category occupancy hits or exceeds 80%.',
        ruleType: 'occupancy',
        conditions: {
          occupancyThreshold: 80,
          occupancyOperator: '>=',
        },
        action: {
          adjustmentType: 'percentage_increase',
          adjustmentValue: 15,
        },
        priority: 10,
        isActive: true,
        enforceClamping: true,
        createdBy: revenueManager._id,
      },
      {
        organizationId: hotelOrg._id,
        name: 'Weekend Surcharge Premium',
        description: 'Applies a 20% premium surcharge for Friday, Saturday, and Sunday bookings to capture peak leisure demand.',
        ruleType: 'weekend',
        conditions: {
          daysOfWeek: ['Friday', 'Saturday', 'Sunday'],
        },
        action: {
          adjustmentType: 'percentage_increase',
          adjustmentValue: 20,
        },
        priority: 8,
        isActive: true,
        enforceClamping: true,
        createdBy: revenueManager._id,
      },
      {
        organizationId: hotelOrg._id,
        name: 'Low Occupancy Promotional Stimulus',
        description: 'Provides a 10% promotional rate discount when unit occupancy drops below 30% to stimulate bookings.',
        ruleType: 'occupancy',
        conditions: {
          occupancyThreshold: 30,
          occupancyOperator: '<=',
        },
        action: {
          adjustmentType: 'percentage_decrease',
          adjustmentValue: 10,
        },
        priority: 5,
        isActive: true,
        enforceClamping: true,
        createdBy: revenueManager._id,
      },
      {
        organizationId: hotelOrg._id,
        name: 'Peak Summer Holiday Schedule',
        description: 'Applies a $25 flat rate increase across all suites during prime summer peak holiday travel.',
        ruleType: 'seasonal',
        conditions: {
          seasonStart: new Date('2026-06-01'),
          seasonEnd: new Date('2026-08-31'),
        },
        action: {
          adjustmentType: 'fixed_increase',
          adjustmentValue: 25,
        },
        priority: 6,
        isActive: false, // Inactive scheduled template
        enforceClamping: true,
        createdBy: revenueManager._id,
      },
    ]);

    console.log(`[Database Seed] Seeded ${pricingRules.length} pricing rules.`);

    // 6. Seed Sample Recommendations for Grand Vista Boutique Hotel
    const recommendations = await PriceRecommendation.create([
      {
        organizationId: hotelOrg._id,
        productId: products[0]._id,
        targetDate: '2026-09-28',
        basePrice: products[0].basePrice,
        currentPrice: products[0].currentPrice,
        recommendedPrice: 220,
        demandMultiplier: 1.22,
        occupancyRate: 84,
        triggerReason: 'High Occupancy Demand Surge (84% >= 80%)',
        status: 'pending',
      },
      {
        organizationId: hotelOrg._id,
        productId: products[1]._id,
        targetDate: '2026-09-29',
        basePrice: products[1].basePrice,
        currentPrice: products[1].currentPrice,
        recommendedPrice: 560,
        demandMultiplier: 1.24,
        occupancyRate: 80,
        triggerReason: 'Occupancy Surge + Penthouse Scarcity (1 unit left)',
        status: 'pending',
      },
      {
        organizationId: hotelOrg._id,
        productId: products[3]._id,
        targetDate: '2026-09-30',
        basePrice: products[3].basePrice,
        currentPrice: products[3].currentPrice,
        recommendedPrice: 125,
        demandMultiplier: 0.89,
        occupancyRate: 25,
        triggerReason: 'Low Occupancy Promotional Stimulus (25% <= 30%)',
        status: 'approved',
        reviewedBy: revenueManager._id,
        reviewedAt: new Date(),
      },
    ]);

    // Seed sample override
    await PriceOverride.create({
      organizationId: hotelOrg._id,
      productId: products[0]._id,
      date: '2026-09-27',
      overridePrice: 240,
      originalPrice: 180,
      recommendedPrice: 220,
      reason: 'Regional Boat Show Weekend VIP allocation',
      status: 'active',
      createdBy: revenueManager._id,
    });

    console.log(`[Database Seed] Seeded ${recommendations.length} recommendations and 1 override.`);

    // 7. Create Sample Notifications
    await Notification.create([
      {
        organizationId: hotelOrg._id,
        title: 'High Demand Surge Detected',
        message: 'Deluxe Ocean View King reached 84% occupancy for upcoming weekend. Rate adjusted to $220.',
        type: 'high_demand',
        severity: 'high',
        read: false,
      },
      {
        organizationId: hotelOrg._id,
        title: 'Price Recommendation Pending',
        message: 'Executive Penthouse Suite has only 1 unit remaining. AI suggests bumping to $580 (+4%).',
        type: 'pending_approval',
        severity: 'medium',
        read: false,
      },
      {
        organizationId: hotelOrg._id,
        title: 'Low Occupancy Alert',
        message: 'Garden Terrace Studio has 25% occupancy. Flash promotional discount applied.',
        type: 'low_occupancy',
        severity: 'low',
        read: true,
      },
    ]);

    // 6. Create Audit Logs
    await AuditLog.create([
      {
        organizationId: hotelOrg._id,
        userId: adminUser._id,
        action: 'SYSTEM_INITIALIZATION',
        entityType: 'Organization',
        entityId: hotelOrg._id,
        details: { note: 'Initial multi-tenant seed completed' },
      },
      {
        organizationId: hotelOrg._id,
        userId: revenueManager._id,
        action: 'PRICE_UPDATE_APPROVED',
        entityType: 'Product',
        entityId: products[0]._id,
        details: { productName: products[0].name, previousPrice: 180, newPrice: 220, reason: 'High weekend occupancy' },
      },
      {
        organizationId: hotelOrg._id,
        userId: staffUser._id,
        action: 'AVAILABILITY_MODIFIED',
        entityType: 'Product',
        entityId: products[1]._id,
        details: { productName: products[1].name, occupiedUnits: 4, availableUnits: 1 },
      },
    ]);

    console.log('[Database Seed] Seeding completed successfully!');
    if (require.main === module) {
      process.exit(0);
    }
    return { success: true, message: 'Seeding completed successfully' };
  } catch (error) {
    console.error('[Database Seed Error]', error);
    if (require.main === module) {
      process.exit(1);
    }
    throw error;
  }
};

if (require.main === module) {
  seedData();
}

module.exports = seedData;
