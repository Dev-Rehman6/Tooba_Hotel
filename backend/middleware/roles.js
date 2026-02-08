export const allowRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res
        .status(403)
        .json({ message: "Forbidden: insufficient permissions" });
    }
    next();
  };
};

// Shorthand for admin-only routes
export const admin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: "Forbidden: Admin access required" });
  }
  next();
};

// Shorthand for staff-only routes
export const staff = (req, res, next) => {
  if (!req.user || (req.user.role !== 'staff' && req.user.role !== 'admin')) {
    return res.status(403).json({ message: "Forbidden: Staff access required" });
  }
  next();
};
