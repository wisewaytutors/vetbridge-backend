const { err } = require('../utils/response');

/**
 * authorize('VET', 'ADMIN') — role-based guard
 */
module.exports = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user?.role))
    return err(res, 'Forbidden — insufficient role', 403);
  next();
};
