const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const authMiddleware = require('../middleware/authMiddleware');

// Admin routes (create and edit) - MUST be before /:id routes
router.get('/create', authMiddleware.isLoggedIn, authMiddleware.isAdmin, categoryController.getCreateCategoryForm);
router.post('/', authMiddleware.isLoggedIn, authMiddleware.isAdmin, categoryController.createCategory);
router.get('/:id/edit', authMiddleware.isLoggedIn, authMiddleware.isAdmin, categoryController.editCategory);
router.put('/:id', authMiddleware.isLoggedIn, authMiddleware.isAdmin, categoryController.updateCategory);
router.delete('/:id', authMiddleware.isLoggedIn, authMiddleware.isAdmin, categoryController.deleteCategory);

// Public routes
router.get('/', authMiddleware.isLoggedIn, authMiddleware.isAdmin, categoryController.getAllCategories); // Список категорий
router.get('/:id', categoryController.getCategoryById); // Конкретная категория

module.exports = router;