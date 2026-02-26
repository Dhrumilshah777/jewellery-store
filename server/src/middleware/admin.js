import { USER_ROLES } from '../models/User.js';

/**
 * Restrict route to admin and super_admin. Must be used after protect.
 */
export const adminOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not authorized.' });
  }
  const allowed = [USER_ROLES[1], USER_ROLES[2]]; // admin, super_admin
  if (!allowed.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Admin access required.' });
  }
  next();
};

/**
 * Restrict route to super_admin only.
 */
export const superAdminOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not authorized.' });
  }
  if (req.user.role !== 'super_admin') {
    return res.status(403).json({ success: false, message: 'Super admin access required.' });
  }
  next();
};
