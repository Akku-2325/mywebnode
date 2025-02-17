const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const bodyParser = require('body-parser');
const path = require('path');
const User = require('./models/User');
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const fs = require('fs'); // Import the fs module
const authMiddleware = require('./middleware/authMiddleware');
const methodOverride = require('method-override'); // Import method-override
const Setting = require('./models/Setting'); // Add Setting model
const Product = require('./models/Product'); // Import the Product model
const Category = require('./models/Category'); // Import category Model
const cloudinary = require('cloudinary').v2; // Cloudinary

const app = express();
const port = process.env.PORT || 3000;

// Session Configuration
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI,
        ttl: 14 * 24 * 60 * 60,
        autoRemove: 'native'
    })
}));

app.use((req, res, next) => {
    console.log('Session:', req.session);
    next();
});

const authRoutes = require('./routes/authRoutes');
const userProductRoutes = require('./routes/userProductRoutes');
const cartRoutes = require('./routes/cartRoutes');
const userRoutes = require('./routes/userRoutes');

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.set('view engine', 'ejs');

app.use('/productList', userProductRoutes);
app.use('/cart', cartRoutes);
app.use('/', userRoutes);

app.use(methodOverride('_method')); // Add method-override middleware

mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => {
        console.log('Connected to MongoDB Atlas');
        mongoose.connection.db.admin().ping()
            .then(() => console.log('Successfully pinged the database'))
            .catch(err => console.error('Failed to ping the database', err));
    })
    .catch(err => console.error('MongoDB connection error:', err));

const isLoggedIn = (req, res, next) => {
    if (req.session.userId) {
        next();
    } else {
        res.redirect('/auth/login');
    }
};

// Routes
app.use('/auth', authRoutes);

const productRoutes = require('./routes/productRoutes');
app.use('/products', productRoutes);

const categoryRoutes = require('./routes/categoryRoutes');
app.use('/categories', categoryRoutes);

const adminRoutes = require('./routes/adminRoutes'); //Add admin Routes
app.use('/admin', adminRoutes);

app.get('/admin', isLoggedIn, authMiddleware.isAdmin, async (req, res) => {
    try {
        res.render('admin/index');
    } catch (error) {
        console.error('Error rendering admin panel:', error);
        res.status(500).send('Error rendering admin panel.');
    }
});

// Main route that renders banner and adds user
app.get('/', authMiddleware.redirectIfAdmin, async (req, res) => {
    const { category, priceMin, priceMax, q } = req.query;
    try {
        const bannerSetting = await Setting.findOne({ key: 'bannerImageUrl' });
        const bannerImageUrl = bannerSetting ? bannerSetting.value : '/banner/default-banner.jpg'; // URL по умолчанию

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
        const products = await Product.find(query).populate('category'); // Fetch all products from the database
        const categories = await Category.find();

        if (req.session.userId) {
            // User is logged in, render the main page
            res.render('main', {
                user: req.session.user,
                bannerImageUrl: bannerImageUrl,
                products: products,
                categories: categories,
                categoryFilter: category || null,
                priceMinFilter: priceMin || null,
                priceMaxFilter: null,
                searchQuery: q || null
            });
        } else {
            // User is not logged in, render the index page
            res.render('index', {
                user:null,
                bannerImageUrl: bannerImageUrl,
                products: products,
                categories: categories,
                categoryFilter: category || null,
                priceMinFilter: null,
                priceMaxFilter: null,
                searchQuery: null
            });
        }
    } catch (error) {
        console.error('Error fetching banner image URL or products:', error);
        // Handle the error, e.g., by rendering with a default banner or an error message
        res.render('index', {
            user:null,
            bannerImageUrl: '/banner/default-banner.jpg',
            products: [],
            categories: [],
            categoryFilter: null,
            priceMinFilter: null,
            priceMaxFilter: null,
            searchQuery: null
        }); // Render index by default
    }
});

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});