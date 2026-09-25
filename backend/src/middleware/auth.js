const jwt = require('jsonwebtoken');
const { User } = require('../../../database/models');

const authenticate = async (req, res, next) => {
  try {
    let token = null;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication token required. Please sign in.',
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_dynamic_pricing_jwt_key_2026');
    const user = await User.findById(decoded.id).populate('organizationId');

    if (!user || user.status !== 'active') {
      return res.status(401).json({
        success: false,
        message: 'Invalid user session or account is inactive.',
      });
    }

    req.user = user;
    req.organization = user.organizationId;
    req.organizationId = user.organizationId._id;

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Token verification failed or expired.',
      error: error.message,
    });
  }
};

module.exports = authenticate;
