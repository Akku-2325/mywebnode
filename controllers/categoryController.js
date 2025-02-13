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

    editCategory: async (req, res) => {
        try {
            const category = await Category.findById(req.params.id);
            if (!category) {
                return res.status(404).send('Category not found');
            }
            res.render('admin/categories/edit', { category });
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
            res.redirect('/categories');
        } catch (error) {
            console.error('Error updating category:', error);
            res.status(500).send('Error updating category.');
        }
    },

    deleteCategory: async (req, res) => {
        try {
            await Category.findByIdAndDelete(req.params.id);
            res.redirect('/categories');
        } catch (error) {
            console.error('Error deleting category:', error);
            res.status(500).send('Error deleting category.');
        }
    }
};

module.exports = categoryController;