import express from 'express';
import { body, validationResult } from 'express-validator';
import { protect } from '../middleware/auth.js';
import * as authController from '../controllers/authController.js';

const router = express.Router();

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  next();
};

router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 6 }).withMessage('Password at least 6 characters'),
    body('name').trim().notEmpty().withMessage('Name required'),
    body('phone').optional().trim().matches(/^[6-9]\d{9}$/).withMessage('Valid 10-digit Indian mobile'),
  ],
  validate,
  authController.register
);

router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  validate,
  authController.login
);

router.post(
  '/refresh',
  body('refreshToken').notEmpty().withMessage('Refresh token required'),
  validate,
  authController.refresh
);

router.post('/logout', protect, authController.logout);
router.get('/me', protect, authController.me);

export default router;
