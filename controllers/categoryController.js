const Category = require('../models/Category');

const categoryController = {
    getAllCategories: async (req, res) => {
        try {
            const categories = await Category.find();
            res.render('admin/categories/index', { categories: categories }); // Correct path
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
            res.render('admin/categories/show', { category: category }); // Correct path (create admin/categories/show.ejs)
        } catch (error) {
            console.error('Error fetching category:', error);
            res.status(500).send('Error fetching category.');
        }
    },

    createCategory: async (req, res) => {
        try {
            console.log("Data received:", req.body); // Проверка данных
            const newCategory = new Category(req.body);
            await newCategory.save();
            console.log("Category saved successfully");
            res.redirect('/categories'); // Перенаправление на список категорий
        } catch (error) {
            console.error('Error creating category:', error);
            res.render('admin/categories/create', { error: 'Failed to create category' }); // Отображение формы с ошибкой
        }
    },

    getCreateCategoryForm: (req, res) => {
        res.render('admin/categories/create');
    },

    editCategory: async (req, res) => {
        try {
            const category = await Category.findById(req.params.id);
            if (!category) {
                return res.status(404).send('Category not found');
            }
            res.render('admin/categories/edit', { category: category }); // Use the correct view
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