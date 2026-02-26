import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import User from '../models/User.js';

/**
 * Protect routes – requires valid JWT. Sets req.user.
 */
export const protect = async (req, res, next) => {
  let token = null;
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.slice(7);
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized. Please login.' });
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    const user = await User.findById(decoded.id).select('-password -refreshToken');
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found.' });
    }
    if (!user.isActive) {
      return res.status(401).json({ success: false, message: 'Account is disabled.' });
    }
    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired. Please login again.' });
    }
    return res.status(401).json({ success: false, message: 'Invalid token.' });
  }
};

/**
 * Optional auth – sets req.user if valid token present, does not reject.
 */
export const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return next();

  try {
    const token = authHeader.slice(7);
    const decoded = jwt.verify(token, config.jwt.secret);
    const user = await User.findById(decoded.id).select('-password -refreshToken');
    if (user?.isActive) req.user = user;
  } catch (_) {
    // ignore invalid/expired token
  }
  next();
};
