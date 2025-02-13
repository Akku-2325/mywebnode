const Product = require('../models/Product');

const productController = {
    getAllProducts: async (req, res) => {
        try {
            const products = await Product.find().populate('category'); // Populate category details
            res.json(products); // Or render a view if needed
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
            res.json(product); // Or render a view
        } catch (error) {
            console.error('Error fetching product:', error);
            res.status(500).json({ message: 'Failed to fetch product' });
        }
    },

    createProduct: async (req, res) => {
        try {
            const newProduct = new Product(req.body);
            await newProduct.save();
            res.status(201).json(newProduct);
        } catch (error) {
            console.error('Error creating product:', error);
            res.status(400).json({ message: 'Failed to create product', error: error.message }); //Include error details
        }
    },

    updateProduct: async (req, res) => {
        try {
            const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
            if (!product) {
                return res.status(404).json({ message: 'Product not found' });
            }
            res.json(product);
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
            getCreateProductForm: (req, res) => {
        res.render('admin/categories/create');
    },

    getEditProductForm: async (req, res) => {
        try {
            const category = await Product.findById(req.params.id);
            if (!category) {
                return res.status(404).send('Product not found');
            }
            res.render('admin/categories/edit', { category });
        } catch (error) {
            console.error('Error fetching category for edit:', error);
            res.status(500).send('Error fetching category for edit.');
        }
    },

    addReview: async (req, res) => {
        try {
            const productId = req.params.id;
            const { userId, rating, comment } = req.body;

            const product = await Product.findById(productId);
            if (!product) {
                return res.status(404).json({ message: 'Product not found' });
            }

            product.reviews.push({ userId, rating, comment });
            await product.save();

            res.status(201).json({ message: 'Review added successfully', product });

        } catch (error) {
            console.error('Error adding review:', error);
            res.status(500).json({ message: 'Failed to add review', error: error.message });
        }
    },

    // Получение всех отзывов о продукте
    getReviews: async (req, res) => {
        try {
            const productId = req.params.id;
            const product = await Product.findById(productId).populate('reviews.userId', 'username profilePicture'); // Populate user info

            if (!product) {
                return res.status(404).json({ message: 'Product not found' });
            }

            res.json(product.reviews);
        } catch (error) {
            console.error('Error fetching reviews:', error);
            res.status(500).json({ message: 'Failed to fetch reviews', error: error.message });
        }
    },
  
    //Удаление отзыва о продукте
    deleteReview: async (req, res) => {
        try {
            const productId = req.params.productId; // Параметр productId
            const reviewId = req.params.reviewId;   // Параметр reviewId

            const product = await Product.findById(productId);
            if (!product) {
                return res.status(404).json({ message: 'Product not found' });
            }

            // Фильтруем массив отзывов, оставляя только те, чей _id не совпадает с reviewId
            product.reviews = product.reviews.filter(review => review._id.toString() !== reviewId);

            await product.save();

            res.json({ message: 'Review deleted successfully', product });
        } catch (error) {
            console.error('Error deleting review:', error);
            res.status(500).json({ message: 'Failed to delete review', error: error.message });
        }
    }

};


module.exports = productController;