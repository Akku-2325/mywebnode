const Product = require('../models/Product');
const Category = require('../models/Category');

const productController = {
    getAllProducts: async (req, res) => {
        try {
            const products = await Product.find().populate('category');
            res.render('admin/products/index', { products: products });
        } catch (error) {
            console.error('Error fetching products:', error);
            res.status(500).json({ message: 'Failed to fetch products' });
        }
    },

    getProductById: async (req, res) => {
        try {
            const product = await Product.findById(req.params.id).populate('category');
            if (!product) {
                return res.status(404).json({ message: 'Product not found' });
            }
            res.render('productDetail', { product: product }); // Render product detail page
        } catch (error) {
            console.error('Error fetching product:', error);
            res.status(500).json({ message: 'Failed to fetch product' });
        }
    },

    createProduct: async (req, res) => {
        try {
            console.log('req.body:', req.body)
            const newProduct = new Product(req.body);
            await newProduct.save();
            res.redirect('/products');
        } catch (error) {
            console.error('Error creating product:', error);
            console.error('Detailed error:', error.message);
            console.error('Stack trace:', error.stack);
            const categories = await Category.find();
            res.render('admin/products/create', {
                error: 'Failed to create product',
                categories: categories
            });
        }
    },

    updateProduct: async (req, res) => {
        try {
            const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
            if (!product) {
                return res.status(404).json({ message: 'Product not found' });
            }
            res.redirect('/products');
        } catch (error) {
            console.error('Error updating product:', error);
            res.status(400).json({ message: 'Failed to update product' });
        }
    },

    deleteProduct: async (req, res) => {
        try {
            const product = await Product.findByIdAndDelete(req.params.id);
            if (!product) {
                return res.status(404).json({ message: 'Product not found' });
            }
            res.json({ message: 'Product deleted' });
        } catch (error) {
            console.error('Error deleting product:', error);
            res.status(500).json({ message: 'Failed to delete product' });
        }
    },

    getCreateProductForm: async (req, res) => {
        try {
            const categories = await Category.find();
            res.render('admin/products/create', { categories: categories }); // Correct path
        } catch (error) {
            console.error('Error fetching categories:', error);
            res.status(500).send('Error fetching categories for the product form.');
        }
    },

    getEditProductForm: async (req, res) => {
        try {
            const product = await Product.findById(req.params.id).populate('category');
            const categories = await Category.find();
            console.log('Categories:', categories)
            if (!product) {
                return res.status(404).send('Product not found');
            }
            res.render('admin/products/edit', { product: product, categories: categories });
        } catch (error) {
            console.error('Error fetching category for edit:', error);
            res.status(500).send('Error fetching category for edit.');
        }
    },
};

module.exports = productController;