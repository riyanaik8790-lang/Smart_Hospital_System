function requireRole(...allowedRoles) {
  const normalizedRoles = allowedRoles.map((role) => role.toLowerCase());

  return (req, res, next) => {
    const userRole = req.user?.role?.toLowerCase();

    if (!userRole || !normalizedRoles.includes(userRole)) {
      return res.status(403).json({ message: "You do not have permission to perform this action." });
    }

    next();
  };
}

module.exports = { requireRole };
