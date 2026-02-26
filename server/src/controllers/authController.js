import User from '../models/User.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt.js';
import { config } from '../config/env.js';

export const register = async (req, res, next) => {
  try {
    const { email, password, name, phone } = req.body;
    const existing = await User.findOne({ email: email?.toLowerCase() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email already registered.' });
    }
    const user = await User.create({ email: email?.toLowerCase(), password, name, phone });
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    await User.findByIdAndUpdate(user._id, { refreshToken });
    const userObj = user.toJSON();
    delete userObj.password;
    res.status(201).json({
      success: true,
      message: 'Registered successfully.',
      user: userObj,
      accessToken,
      refreshToken,
      expiresIn: config.jwt.expiresIn,
    });
  } catch (err) {
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email?.toLowerCase() }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }
    if (!user.isActive) {
      return res.status(401).json({ success: false, message: 'Account is disabled.' });
    }
    await User.findByIdAndUpdate(user._id, { lastLoginAt: new Date() });
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    await User.findByIdAndUpdate(user._id, { refreshToken });
    const userObj = (await User.findById(user._id)).toJSON();
    res.json({
      success: true,
      user: userObj,
      accessToken,
      refreshToken,
      expiresIn: config.jwt.expiresIn,
    });
  } catch (err) {
    next(err);
  }
};

export const refresh = async (req, res, next) => {
  try {
    const { refreshToken: token } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, message: 'Refresh token required.' });
    }
    const decoded = verifyRefreshToken(token);
    const user = await User.findById(decoded.id).select('+refreshToken');
    if (!user || user.refreshToken !== token) {
      return res.status(401).json({ success: false, message: 'Invalid refresh token.' });
    }
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    await User.findByIdAndUpdate(user._id, { refreshToken });
    const userObj = (await User.findById(user._id)).select('-password -refreshToken');
    res.json({
      success: true,
      user: userObj,
      accessToken,
      refreshToken,
      expiresIn: config.jwt.expiresIn,
    });
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Refresh token expired.' });
    }
    next(err);
  }
};

export const logout = async (req, res, next) => {
  try {
    if (req.user?.id) {
      await User.findByIdAndUpdate(req.user.id, { $unset: { refreshToken: 1 } });
    }
    res.json({ success: true, message: 'Logged out.' });
  } catch (err) {
    next(err);
  }
};

export const me = async (req, res, next) => {
  try {
    res.json({ success: true, user: req.user });
  } catch (err) {
    next(err);
  }
};
