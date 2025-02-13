const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const authMiddleware = require('../middleware/authMiddleware');

// Public routes
router.get('/', categoryController.getAllCategories);
router.get('/:id', categoryController.getCategoryById);

// Admin routes
router.get('/create', authMiddleware.isLoggedIn, authMiddleware.isAdmin, categoryController.getCreateCategoryForm);
router.post('/', authMiddleware.isLoggedIn, authMiddleware.isAdmin, categoryController.createCategory);
router.put('/:id', authMiddleware.isLoggedIn, authMiddleware.isAdmin, categoryController.updateCategory);
router.delete('/:id', authMiddleware.isLoggedIn, authMiddleware.isAdmin, categoryController.deleteCategory);

// Admin routes for editing
router.get('/:id/edit', authMiddleware.isLoggedIn, authMiddleware.isAdmin, categoryController.editCategory);
router.put('/:id', authMiddleware.isLoggedIn, authMiddleware.isAdmin, categoryController.updateCategory);
router.delete('/:id', authMiddleware.isLoggedIn, authMiddleware.isAdmin, categoryController.deleteCategory);

module.exports = router;