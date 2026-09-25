// Role hierarchy and permissions checker
// Roles: admin > revenue_manager > staff > viewer

const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: User role not defined.',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: '${req.user.role}' does not have sufficient permissions for this action. Allowed: ${allowedRoles.join(', ')}`,
      });
    }

    next();
  };
};

module.exports = authorize;
