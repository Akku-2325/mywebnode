const Category = require('../models/Category');

const categoryController = {
    getAllCategories: async (req, res) => {
        try {
            const categories = await Category.find();
            res.json(categories);
        } catch (error) {
            console.error('Error fetching categories:', error);
            res.status(500).json({ message: 'Failed to fetch categories' });
        }
    },

    getCategoryById: async (req, res) => {
        try {
            const category = await Category.findById(req.params.id);
            if (!category) {
                return res.status(404).json({ message: 'Category not found' });
            }
            res.json(category);
        } catch (error) {
            console.error('Error fetching category:', error);
            res.status(500).json({ message: 'Failed to fetch category' });
        }
    },

    createCategory: async (req, res) => {
        try {
            const newCategory = new Category(req.body);
            await newCategory.save();
            res.redirect('/categories');
            //res.status(201).json(newCategory);
        } catch (error) {
            console.error('Error creating category:', error);
            res.render('admin/categories/create', { error: 'Failed to create category' });
            //res.status(400).json({ message: 'Failed to create category' });
        }
    },

    updateCategory: async (req, res) => {
        try {
            const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
            if (!category) {
                return res.status(404).json({ message: 'Category not found' });
            }
            res.json(category);
        } catch (error) {
            console.error('Error updating category:', error);
            res.status(400).json({ message: 'Failed to update category' });
        }
    },

    deleteCategory: async (req, res) => {
        try {
            const category = await Category.findByIdAndDelete(req.params.id);
            if (!category) {
                return res.status(404).json({ message: 'Category not found' });
            }
            res.json({ message: 'Category deleted' });
        } catch (error) {
            console.error('Error deleting category:', error);
            res.status(500).json({ message: 'Failed to delete category' });
        }
    }
};

module.exports = categoryController;