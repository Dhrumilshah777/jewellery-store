import express from 'express';
import { protect } from '../middleware/auth.js';
import * as orderController from '../controllers/orderController.js';

const router = express.Router();

router.use(protect);

router.post('/', orderController.createOrder);
router.post('/create-payment-order', orderController.createPaymentOrder);
router.post('/verify-payment', orderController.verifyPayment);
router.get('/', orderController.getMyOrders);
router.get('/:id', orderController.getOrderById);

export default router;
