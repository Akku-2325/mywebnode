const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const authMiddleware = require('../middleware/authMiddleware');

// Public routes
router.get('/', categoryController.getAllCategories);
router.get('/:id', categoryController.getCategoryById);

// Admin routes
router.get('/create', authMiddleware.isLoggedIn, authMiddleware.isAdmin, (req, res) => {
    res.render('admin/categories/create'); // render form to create category
});
router.post('/', authMiddleware.isLoggedIn, authMiddleware.isAdmin, categoryController.createCategory);
router.put('/:id', authMiddleware.isLoggedIn, authMiddleware.isAdmin, categoryController.updateCategory);
router.delete('/:id', authMiddleware.isLoggedIn, authMiddleware.isAdmin, categoryController.deleteCategory);

module.exports = router;