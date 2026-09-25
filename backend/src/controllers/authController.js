const jwt = require('jsonwebtoken');
const { User, Organization, AuditLog } = require('../../../database/models');

const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET || 'super_secret_dynamic_pricing_jwt_key_2026',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// @desc Register user & organization
// @route POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { name, email, password, organizationName, industry, role } = req.body;

    if (!name || !email || !password || !organizationName) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, password, and organization name are required.',
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email address already exists.',
      });
    }

    // Create organization
    const slug = organizationName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') + '-' + Math.floor(1000 + Math.random() * 9000);

    const organization = await Organization.create({
      name: organizationName,
      slug,
      industry: industry || 'hotel',
    });

    // Create user (first user of an organization is Admin by default)
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: role || 'admin',
      organizationId: organization._id,
      status: 'active',
    });

    await AuditLog.create({
      organizationId: organization._id,
      userId: user._id,
      action: 'ORGANIZATION_CREATED',
      entityType: 'Organization',
      entityId: organization._id,
      details: { organizationName, adminEmail: email },
    });

    const token = generateToken(user._id);

    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        organization: {
          id: organization._id,
          name: organization.name,
          slug: organization.slug,
          industry: organization.industry,
          currency: organization.currency,
        },
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error during registration',
      error: error.message,
    });
  }
};

// @desc Login user
// @route POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.',
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() })
      .select('+password')
      .populate('organizationId');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. User not found.',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Password incorrect.',
      });
    }

    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Account is suspended or inactive. Please contact your administrator.',
      });
    }

    user.lastLogin = new Date();
    await user.save();

    await AuditLog.create({
      organizationId: user.organizationId._id,
      userId: user._id,
      action: 'AUTH_LOGIN',
      entityType: 'User',
      entityId: user._id,
      details: { email: user.email, role: user.role },
    });

    const token = generateToken(user._id);

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        organization: {
          id: user.organizationId._id,
          name: user.organizationId.name,
          slug: user.organizationId.slug,
          industry: user.organizationId.industry,
          currency: user.organizationId.currency,
        },
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: error.message,
    });
  }
};

// @desc Get current authenticated user
// @route GET /api/auth/me
exports.getMe = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        organization: {
          id: req.organization._id,
          name: req.organization.name,
          slug: req.organization.slug,
          industry: req.organization.industry,
          currency: req.organization.currency,
          settings: req.organization.settings,
        },
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch user session',
      error: error.message,
    });
  }
};

// @desc Get demo accounts for quick role switching and testing
// @route GET /api/auth/demo-accounts
exports.getDemoAccounts = async (req, res) => {
  try {
    const users = await User.find({
      email: {
        $in: [
          'admin@grandvista.com',
          'revenue@grandvista.com',
          'staff@grandvista.com',
          'viewer@grandvista.com',
        ],
      },
    }).populate('organizationId');

    const accounts = users.map((u) => ({
      name: u.name,
      email: u.email,
      role: u.role,
      organizationName: u.organizationId ? u.organizationId.name : 'Grand Vista Boutique Hotel',
    }));

    return res.status(200).json({
      success: true,
      accounts,
      defaultPassword: 'password123',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc Seed database with demo data (can be triggered from frontend or demo setup)
// @route POST /api/auth/seed-demo
exports.seedDemoDatabase = async (req, res) => {
  try {
    const seedData = require('../../../database/seed');
    await seedData();
    return res.status(200).json({
      success: true,
      message: 'Demo database seeded successfully with Grand Vista Hotel and Apex Events!',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to seed demo database',
      error: error.message,
    });
  }
};
