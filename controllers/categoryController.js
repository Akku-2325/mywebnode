const Category = require('../models/Category');

const categoryController = {
    getAllCategories: async (req, res) => {
        try {
            const categories = await Category.find();
            res.render('admin/products/index', { categories }); //Отображаем все категории
        } catch (error) {
            console.error('Error fetching categories:', error);
            res.status(500).send('Error fetching categories');
        }
    },

    getCategoryById: async (req, res) => {
        try {
            const category = await Category.findById(req.params.id);
            if (!category) {
                return res.status(404).send('Category not found');
            }
            res.render('admin/products/edit', { category });
        } catch (error) {
            console.error('Error fetching category:', error);
            res.status(500).send('Error fetching category.');
        }
    },

    createCategory: async (req, res) => {
        try {
            const newCategory = new Category(req.body);
            await newCategory.save();
            res.redirect('/products');
        } catch (error) {
            console.error('Error creating category:', error);
            res.render('admin/products/create', { error: 'Failed to create category' });
        }
    },

    getCreateCategoryForm: (req, res) => {
        res.render('admin/products/create');
    },

    editCategory: async (req, res) => {
        try {
            const category = await Category.findById(req.params.id);
            if (!category) {
                return res.status(404).send('Category not found');
            }
            res.render('admin/products/edit', { category });
        } catch (error) {
            console.error('Error fetching category for edit:', error);
            res.status(500).send('Error fetching category for edit.');
        }
    },

    updateCategory: async (req, res) => {
        try {
            const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
            if (!category) {
                return res.status(404).send('Category not found');
            }
            res.redirect('/products');
        } catch (error) {
            console.error('Error updating category:', error);
            res.status(500).send('Error updating category.');
        }
    },

    deleteCategory: async (req, res) => {
        try {
            await Category.findByIdAndDelete(req.params.id);
            res.redirect('/products');
        } catch (error) {
            console.error('Error deleting category:', error);
            res.status(500).send('Error deleting category.');
        }
    }
};

module.exports = categoryController;