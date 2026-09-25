const { User, AuditLog } = require('../../../database/models');

// @desc Get all users for organization
// @route GET /api/users
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find({ organizationId: req.organizationId })
      .select('-password')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Create a new user for organization (Admin only)
// @route POST /api/users
exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and temporary password are required.',
      });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email already exists.',
      });
    }

    const newUser = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: role || 'staff',
      organizationId: req.organizationId,
      status: 'active',
    });

    await AuditLog.create({
      organizationId: req.organizationId,
      userId: req.user._id,
      action: 'USER_CREATED',
      entityType: 'User',
      entityId: newUser._id,
      details: { createdUser: email, role: newUser.role },
    });

    return res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        status: newUser.status,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Update user role or status (Admin only)
// @route PUT /api/users/:id
exports.updateUser = async (req, res) => {
  try {
    const { role, status, name } = req.body;

    const targetUser = await User.findOne({
      _id: req.params.id,
      organizationId: req.organizationId,
    });

    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found in this organization.' });
    }

    if (role) targetUser.role = role;
    if (status) targetUser.status = status;
    if (name) targetUser.name = name;

    await targetUser.save();

    await AuditLog.create({
      organizationId: req.organizationId,
      userId: req.user._id,
      action: 'USER_UPDATED',
      entityType: 'User',
      entityId: targetUser._id,
      details: { updatedUserId: targetUser._id, updates: { role, status, name } },
    });

    return res.status(200).json({
      success: true,
      message: 'User updated successfully',
      user: targetUser,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
