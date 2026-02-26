import express from 'express';
import { body, param, validationResult } from 'express-validator';
import { protect } from '../middleware/auth.js';
import * as cartController from '../controllers/cartController.js';

const router = express.Router();
router.use(protect);

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  next();
};

router.get('/', cartController.getCart);

router.post(
  '/items',
  [
    body('productId').isMongoId().withMessage('Valid product ID required'),
    body('quantity').optional().isInt({ min: 1 }).toInt(),
  ],
  validate,
  cartController.addToCart
);

router.patch(
  '/items',
  [
    body('productId').isMongoId(),
    body('quantity').isInt({ min: 1 }).toInt(),
  ],
  validate,
  cartController.updateCartItem
);

router.delete('/items/:productId', param('productId').isMongoId(), validate, cartController.removeFromCart);
router.delete('/items', cartController.removeFromCart); // body: { productId }
router.delete('/', cartController.clearCart);

export default router;
