const Product = require('../models/Product');
const Category = require('../models/Category');

const productController = {
    getAllProducts: async (req, res) => {
        try {
            const { q, metalType, gemstone, style, priceMin, priceMax, jewelryType, brand, collection } = req.query;  // Get query parameters

            let query = {}; // Start with an empty query

            // Text Search (if 'q' parameter is provided)
            if (q) {
                query.$text = { $search: q };
            }

            // Filtering
            if (metalType) {
                // If metalType is an array (multiple values), use $in operator
                if (Array.isArray(metalType)) {
                    query.metalType = { $in: metalType };
                } else {
                    query.metalType = metalType;
                }
            }
            if (gemstone) {
                query.gemstone = gemstone;
            }
            if (style) {
                query.style = style;
            }
           if (jewelryType) {
                query.jewelryType = jewelryType;
            }
            if (brand) {
                query.brand = brand;
            }
            if (collection) {
                query.collection = collection;
            }

            // Price Range Filtering
            if (priceMin) {
                query.price = { $gte: parseFloat(priceMin) }; // Greater than or equal to
            }
            if (priceMax) {
                query.price = { ...query.price, $lte: parseFloat(priceMax) }; // Less than or equal to
            }

            const products = await Product.find(query).populate('category'); // Execute the query

            // Send distinct values for filters (for dynamic filter options)
            const distinctMetalTypes = await Product.distinct("metalType");
            const distinctGemstones = await Product.distinct("gemstone");
            const distinctStyles = await Product.distinct("style");
            const distinctjewelryTypes = await Product.distinct("jewelryType");
            const distinctBrands = await Product.distinct("brand");
            const distinctCollections = await Product.distinct("collection");

            res.render('admin/products/index', {
                products: products,
                distinctMetalTypes: distinctMetalTypes,
                distinctGemstones: distinctGemstones,
                distinctStyles: distinctStyles,
                distinctjewelryTypes: distinctjewelryTypes,
                distinctBrands: distinctBrands,
                distinctCollections: distinctCollections
            });
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
            res.render('productDetail', { product: product });
        } catch (error) {
            console.error('Error fetching product:', error);
            res.status(500).json({ message: 'Failed to fetch product' });
        }
    },

    createProduct: async (req, res) => {
        try {
            const newProduct = new Product(req.body);
            await newProduct.save();
            res.redirect('/products');
        } catch (error) {
            console.error('Error creating product:', error);
            const categories = await Category.find();
            res.render('admin/products/create', {
                error: 'Failed to create product',
                categories: categories
            });
        }
    },

    getCreateProductForm: async (req, res) => {
        try {
            const categories = await Category.find();
            res.render('admin/products/create', { categories: categories });
        } catch (error) {
            console.error('Error fetching categories:', error);
            res.status(500).send('Error fetching categories for the product form.');
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
};

module.exports = productController;