import express from 'express';
import { protect } from '../middleware/auth.js';
import { adminOnly } from '../middleware/admin.js';
import { uploadSingle } from '../middleware/upload.js';
import * as productController from '../controllers/productController.js';
import * as orderController from '../controllers/orderController.js';
import * as uploadController from '../controllers/uploadController.js';

const router = express.Router();

router.use(protect);
router.use(adminOnly);

// Upload image (Cloudinary)
router.post('/upload-image', uploadSingle, uploadController.uploadImage);

// Products
router.get('/products', productController.adminGetProducts);
router.post('/products', productController.adminCreateProduct);
router.put('/products/:id', productController.adminUpdateProduct);
router.patch('/products/:id', productController.adminUpdateProduct);
router.delete('/products/:id', productController.adminDeleteProduct);

// Orders
router.get('/orders', orderController.adminGetOrders);
router.patch('/orders/:id', orderController.adminUpdateOrderStatus);

export default router;
