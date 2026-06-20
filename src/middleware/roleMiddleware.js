const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        status: false,
        message: 'Unauthorized: No user found',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        status: false,
        message: `Forbidden: Requires one of these roles: ${allowedRoles.join(', ')}`,
      });
    }

    next();
  };
};

module.exports = authorizeRoles;
