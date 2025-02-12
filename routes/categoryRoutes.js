const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', categoryController.getAllCategories);
router.get('/:id', categoryController.getCategoryById);

router.post('/', authMiddleware.isLoggedIn, authMiddleware.isAdmin, categoryController.createCategory);
router.put('/:id', authMiddleware.isLoggedIn, authMiddleware.isAdmin, categoryController.updateCategory);
router.delete('/:id', authMiddleware.isLoggedIn, authMiddleware.isAdmin, categoryController.deleteCategory);

module.exports = router;