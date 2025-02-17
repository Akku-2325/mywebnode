router.get('/', async (req, res) => {
    const { page = 1, category, priceMin, priceMax, q } = req.query;
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

        const skip = (page - 1) * productsPerPage;

        const products = await Product.find(query)
            .populate('category')
            .skip(skip)
            .limit(productsPerPage)
            .exec();

        const totalProducts = await Product.countDocuments(query);
        const totalPages = Math.ceil(totalProducts / productsPerPage);

        // Generate links array for pagination
        const paginationLinks = generatePaginationLinks(parseInt(page), totalPages);

        // Fetch all categories for filtering options
        const categories = await Category.find();

        res.render('userProducts/index', {
            products: products,
            categories: categories,
            currentPage: parseInt(page),
            totalPages: totalPages,
            paginationLinks: paginationLinks,
            categoryFilter: category || null,
            priceMinFilter: priceMin || null,
            priceMaxFilter: priceMax || null,
            searchQuery: q || null
        });

    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).send('Error fetching products');
    }
});