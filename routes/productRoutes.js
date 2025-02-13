const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const authMiddleware = require('../middleware/authMiddleware');

// Public routes
router.get('/', productController.getAllProducts);
router.get('/:id', productController.getProductById);

// Admin-protected routes
router.get('/create', authMiddleware.isLoggedIn, authMiddleware.isAdmin,productController.getCreateProductForm);
router.post('/', authMiddleware.isLoggedIn, authMiddleware.isAdmin, productController.createProduct);
router.put('/:id', authMiddleware.isLoggedIn, authMiddleware.isAdmin, productController.updateProduct);
router.delete('/:id', authMiddleware.isLoggedIn, authMiddleware.isAdmin, productController.deleteProduct);

// Маршруты для работы с отзывами
router.post('/:id/reviews', authMiddleware.isLoggedIn, productController.addReview); // Добавление отзыва (требуется аутентификация)
router.get('/:id/reviews', productController.getReviews); // Получение всех отзывов о продукте
router.delete('/:productId/reviews/:reviewId', authMiddleware.isLoggedIn, productController.deleteReview); //Удаление отзыва


module.exports = router;