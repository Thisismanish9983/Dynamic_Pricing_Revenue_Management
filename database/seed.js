const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });
const mongoose = require('mongoose');
const connectDB = require('./connection');
const { Organization, User, Product, AuditLog, Notification } = require('./models');

const seedData = async () => {
  try {
    await connectDB(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/dynamic_pricing_db');
    console.log('[Database Seed] Starting database seeding...');

    // Clean existing data
    await Organization.deleteMany({});
    await User.deleteMany({});
    await Product.deleteMany({});
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

    // 5. Create Sample Notifications
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
