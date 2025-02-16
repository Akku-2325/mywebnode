const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Category = require('../models/Category');

// Helper function to generate page links
function generatePaginationLinks(currentPage, totalPages) {
    let links = [];
    for (let i = 1; i <= totalPages; i++) {
        links.push({ page: i, active: i === currentPage });
    }
    return links;
}

router.get('/', async (req, res) => {
    const { page = 1, category, priceMin, priceMax, q, sortBy } = req.query;
    const productsPerPage = 20; // Number of products per page

    try {
        let query = {};

        if (q) {
            query.$text = { $search: q };
        }

        if (category) {
            query.category = category;
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

        let sort = {};
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

        const skip = (page - 1) * productsPerPage;

        const products = await Product.find(query)
            .populate('category')
            .skip(skip)
            .limit(productsPerPage)
            .sort(sort)
            .exec();

        const totalProducts = await Product.countDocuments(query);
        const totalPages = Math.ceil(totalProducts / productsPerPage);

        // Generate links array for pagination
        const paginationLinks = generatePaginationLinks(parseInt(page), totalPages);

        // Fetch all categories for filtering options
        const categories = await Category.find();

        let categoryData = null;
        if (category) {
            categoryData = await Category.findById(category);
        }

        res.render('userProducts/index', {
            products: products,
            categories: categories,
            currentPage: parseInt(page),
            totalPages: totalPages,
            paginationLinks: paginationLinks,
            categoryFilter: category || null,
            priceMinFilter: priceMin || null,
            priceMaxFilter: priceMax || null,
            searchQuery: q || null,
            categoryData: categoryData,
            sortBy: sortBy 
        });

    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).send('Error fetching products');
    }
});

router.get('/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id).populate('category');
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.render('userProducts/productDetail', { product: product });  // Use the correct view path
    } catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).json({ message: 'Failed to fetch product' });
    }
});

module.exports = router;