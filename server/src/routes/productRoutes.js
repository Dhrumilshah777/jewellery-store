import express from 'express';
import * as productController from '../controllers/productController.js';

const router = express.Router();

// Public
router.get('/', productController.getProducts);
router.get('/slug/:slug', productController.getProductBySlug);
router.get('/:id', productController.getProductById);

export default router;
