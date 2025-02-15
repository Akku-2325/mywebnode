// productController.js
const Product = require('../models/Product');
const Category = require('../models/Category');

const productController = {
    getAllProducts: async (req, res) => {
        try {
            const { q, metalType, gemstone, style, priceMin, priceMax, jewelryType, brand, collection, sortBy } = req.query;

            let query = {};
            let sort = {};

            if (q) {
                query.$text = { $search: q };
            }

            if (metalType !== undefined && metalType !== null) {
                if (Array.isArray(metalType)) {
                    query.metalType = { $in: metalType };
                } else {
                    query.metalType = { $in: [metalType] };
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

           if (priceMin !== undefined && priceMin !== '') {
                query.price = { $gte: parseFloat(priceMin) };
            }
            if (priceMax !== undefined && priceMax !== '') {
                query.price = { ...query.price, $lte: parseFloat(priceMax) };
                if (!query.price) {
                    query.price = { $lte: parseFloat(priceMax) };
                }
            }

            if (sortBy) {
                switch (sortBy) {
                    case 'priceAsc':
                        sort = { price: 1 };
                        break;
                    case 'priceDesc':
                        sort = { price: -1 };
                        break;
                    case 'nameAsc':
                        sort = { name: 1 };
                        break;
                    case 'nameDesc':
                        sort = { name: -1 };
                        break;
                    default:
                        break;
                }
            }

            console.log("Query:", query);
            console.log("Sort:", sort);

            const products = await Product.find(query).populate('category').sort(sort);

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
                distinctCollections: distinctCollections,
                q: q,
                metalType: metalType,
                gemstone: gemstone,
                style: style,
                jewelryType: jewelryType,
                brand: brand,
                collection: collection,
                priceMin: priceMin,
                priceMax: priceMax,
                sortBy: sortBy
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

    getEditProductForm: async (req, res) => {
        try {
            const product = await Product.findById(req.params.id).populate('category');
            const categories = await Category.find();
            if (!product) {
                return res.status(404).json({ message: 'Product not found' });
            }
            res.render('admin/products/edit', { product: product, categories: categories });
        } catch (error) {
            console.error('Error fetching product for edit:', error);
            res.status(500).send('Error fetching product for edit.');
        }
    },

    updateProduct: async (req, res) => {
        try {
            const productId = req.params.id;
            const product = await Product.findById(productId);

            if (!product) {
                return res.status(404).json({ message: 'Product not found' });
            }

            const tags = req.body.tags ? req.body.tags.split(',').map(tag => tag.trim()) : [];

            // Update product properties
            product.name = req.body.name;
            product.description = req.body.description;
            product.price = req.body.price;
            product.category = req.body.category;
            product.metalType = req.body.metalType;
            product.gemstone = req.body.gemstone;
            product.gemstoneColor = req.body.gemstoneColor;
            product.gemstoneCarat = req.body.gemstoneCarat;
            product.style = req.body.style;
            product.jewelryType = req.body.jewelryType;
            product.size = req.body.size;
            product.weight = req.body.weight;
            product.brand = req.body.brand;
            product.collection = req.body.collection;
            product.tags = tags;
            product.stock = req.body.stock;

            await product.save();
            console.log("updated successfully");
            res.redirect('/products'); // Redirect to the products list

        } catch (error) {
            console.error('Error updating product:', error);
            res.status(400).json({ message: 'Failed to update product' });
        }
    },

    deleteProduct: async (req, res) => {
        try {
            const productId = req.params.id;
            console.log(`Attempting to delete product with ID: ${productId}`);
            const product = await Product.findByIdAndDelete(productId);
            if (!product) {
                console.log(`Product with ID ${productId} not found`);
                return res.status(404).json({ message: 'Product not found' });
            }
            console.log(`Product with ID ${productId} deleted successfully`);
            res.redirect('/products');
        } catch (error) {
            console.error('Error deleting product:', error);
            res.status(500).json({ message: 'Failed to delete product' });
        }
    },
};

module.exports = productController;