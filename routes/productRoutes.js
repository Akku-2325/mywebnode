// productRoutes.js
const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const authMiddleware = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const cloudinary = require('cloudinary').v2;

// Cloudinary configuration (ensure this is set up correctly with your credentials)
cloudinary.config({
  cloud_name: 'your_cloud_name',
  api_key: 'your_api_key',
  api_secret: 'your_api_secret'
});

// Admin-protected routes
router.get('/create', authMiddleware.isLoggedIn, authMiddleware.isAdmin, productController.getCreateProductForm);
router.post('/', authMiddleware.isLoggedIn, authMiddleware.isAdmin, upload.array('images', 5), productController.createProduct);

// Route to render the edit form
router.get('/:id/edit', authMiddleware.isLoggedIn, authMiddleware.isAdmin, productController.getEditProductForm);

router.put('/:id', authMiddleware.isLoggedIn, authMiddleware.isAdmin, upload.array('images', 5), productController.updateProduct);
router.delete('/:id', authMiddleware.isLoggedIn, authMiddleware.isAdmin, productController.deleteProduct);

// Public routes
router.get('/', productController.getAllProducts);
router.get('/:id', productController.getProductById);

module.exports = router;