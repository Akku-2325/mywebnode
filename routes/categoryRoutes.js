const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const authMiddleware = require('../middleware/authMiddleware'); // Предполагаю, что у тебя есть middleware для проверки авторизации

// Admin routes (create and edit) - MUST be before /:id routes
router.get('/create', authMiddleware.isLoggedIn, authMiddleware.isAdmin, categoryController.getCreateCategoryForm);
router.post('/', authMiddleware.isLoggedIn, authMiddleware.isAdmin, categoryController.createCategory);
router.get('/:id/edit', authMiddleware.isLoggedIn, authMiddleware.isAdmin, categoryController.editCategory); // authMiddleware added
router.put('/:id', authMiddleware.isLoggedIn, authMiddleware.isAdmin, categoryController.updateCategory); // authMiddleware added
router.delete('/:id', authMiddleware.isLoggedIn, authMiddleware.isAdmin, categoryController.deleteCategory); // authMiddleware added

// Public routes (or routes with specific auth if needed)
router.get('/', authMiddleware.isLoggedIn, authMiddleware.isAdmin, categoryController.getAllCategories); // authMiddleware added
router.get('/:id', categoryController.getCategoryById); // This might need auth too, depending on your needs

module.exports = router;