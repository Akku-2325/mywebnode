const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const authMiddleware = require('../middleware/authMiddleware');

// Admin-protected routes
router.get('/create', authMiddleware.isLoggedIn, authMiddleware.isAdmin, productController.getCreateProductForm);
router.post('/', authMiddleware.isLoggedIn, authMiddleware.isAdmin, productController.createProduct);
router.get('/:id/edit', authMiddleware.isLoggedIn, authMiddleware.isAdmin, productController.getEditProductForm);
router.put('/:id', authMiddleware.isLoggedIn, authMiddleware.isAdmin, productController.updateProduct);
router.delete('/:id', authMiddleware.isLoggedIn, authMiddleware.isAdmin, productController.deleteProduct);

// Public routes
router.get('/', productController.getAllProducts);
router.get('/:id', productController.getProductById);


module.exports = router;