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

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.set('view engine', 'ejs');

app.use('/productList', userProductRoutes);
app.use('/cart', cartRoutes);

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

app.get('/profile', isLoggedIn, async (req, res) => {
    try {
        const user = await User.findById(req.session.userId).lean();

        const editMode = req.query.edit === 'true';

        res.render('profile', {
            user: user,
            editing: editMode,
            errors: []
        });
    } catch (error) {
        console.error('Error fetching data:', error);
        res.render('profile', { user: req.session.user, error: 'Failed to fetch profile.', editing: false, errors: [] }); // Updated
    }
});

app.post('/profile/edit', isLoggedIn, [
    body('username').trim().isLength({ min: 3, max: 20 }).withMessage('Username must be between 3 and 20 characters'),
    body('firstName').trim().isLength({ max: 50 }).withMessage('First name cannot be longer than 50 characters'),
    body('lastName').trim().isLength({ max: 50 }).withMessage('Last name cannot be longer than 50 characters'),
    body('location').trim().isLength({ max: 50 }).withMessage('Location cannot be longer than 50 characters'),
    body('website').trim().isURL().withMessage('Website must be a valid URL').optional({ nullable: true, checkFalsy: true }),
    body('bio').trim().isLength({ max: 200 }).withMessage('Bio cannot be longer than 50 characters')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const user = await User.findById(req.session.userId).lean()
            return res.render('profile', {
                user: user,
                editing: true,
                errors: errors.array()
            });
        }

        const { username, firstName, lastName, location, website, bio } = req.body;
        const userId = req.session.userId;

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).send('User not found');
        }

        user.username = username;
        user.firstName = firstName;
        user.lastName = lastName;
        user.location = location;
        user.website = website;
        user.bio = bio;

        await user.save();

        req.session.user = {
            _id: user._id,
            email: user.email,
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            location: user.location,
            website: user.website,
            bio: user.bio,
            profilePicture: user.profilePicture,
        };

        res.redirect('/profile');
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).send('An error occurred while updating the profile.');
    }
});

app.post('/profile/delete', isLoggedIn, async (req, res) => {
    try {
        await User.findByIdAndDelete(req.session.userId);
        req.session.destroy((err) => {
            if (err) {
                console.error('Error destroying session:', err);
                return res.redirect('/');
            }
            res.redirect('/auth/register');
        });
    } catch (error) {
        console.error('Error deleting account:', error);
        res.status(500).send('An error occurred while deleting the account.');
    }
});

app.post('/profile/remove-picture', isLoggedIn, async (req, res) => {
    try {
        const userId = req.session.userId;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).send('User not found');
        }

        user.profilePicture = '/banner/default-profile.png';
        await user.save();

        req.session.user.profilePicture = user.profilePicture;

        res.redirect('/profile');
    } catch (error) {
        console.error('Error uploading profile picture:', error);
        res.status(500).send('An error occurred while uploading the profile picture.');
    }
});

app.post('/profile/upload', isLoggedIn, async (req, res) => {
    try {
        const userId = req.session.userId;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).send('User not found');
        }

        if (!req.file) {
            console.log('No file uploaded');
            return res.redirect('/profile');
        }

        // Upload to Cloudinary
        const result = await cloudinary.uploader.upload(req.file.path);
        user.profilePicture = result.secure_url;

        req.session.user = {
            _id: user._id,
            email: user.email,
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            location: user.location,
            website: user.website,
            bio: bio,
            profilePicture: user.profilePicture,
        };

        res.redirect('/profile');
    } catch (error) {
        console.error('Error uploading profile picture:', error);
        res.status(500).send('An error occurred while uploading the profile picture.');
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
                searchQuery: q || null
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