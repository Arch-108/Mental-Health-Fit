// Usage: requireRole('doctor', 'admin') as a route middleware AFTER requireAuth.
// This is the enforcement point for FR10 (RBAC) from the requirements doc -
// every new route that touches patient/doctor-only data must use this.
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'You do not have permission to access this resource.' });
    }
    next();
  };
}

module.exports = { requireRole };
