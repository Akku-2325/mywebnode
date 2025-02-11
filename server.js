require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const bodyParser = require('body-parser');
const authRoutes = require('./routes/auth');
const dataRoutes = require('./routes/data');
const path = require('path');
const Note = require('./models/Note');
const User = require('./models/User');
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const fs = require('fs'); // Import the fs module


const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.set('view engine', 'ejs');

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

// MongoDB Connection
// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => {
    console.log('Connected to MongoDB Atlas');
    // Дополнительная проверка: выполните простой запрос сразу после подключения
    mongoose.connection.db.admin().ping()
        .then(() => console.log('Successfully pinged the database'))
        .catch(err => console.error('Failed to ping the database', err));
})
.catch(err => console.error('MongoDB connection error:', err));

// Middleware to check if user is logged in
const isLoggedIn = (req, res, next) => {
    if (req.session.userId) {
        next();
    } else {
        res.redirect('/auth/login');
    }
};

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, 'public', 'uploads'); // Construct the full path
        // Check if the directory exists, and create it if it doesn't
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true }); // Create the directory recursively
        }
        cb(null, uploadDir);  // Store uploaded files in the 'public/uploads' directory
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname)); // Rename the file
    }
});

const upload = multer({ storage: storage });

// Routes
app.use('/auth', authRoutes);
app.use('/data', dataRoutes);

// Protected route example
app.get('/profile', isLoggedIn, async (req, res) => {
    try {
        const notes = await Note.find({ userId: req.session.userId }); // Fetch notes
        const user = await User.findById(req.session.userId).lean(); // Get user data

        const editMode = req.query.edit === 'true';
        
        res.render('profile', { 
            user: user, 
            notes: notes, 
            editing: editMode,
            errors: [] // Initialize errors array
         });
    } catch (error) {
        console.error('Error fetching data:', error);
        res.render('profile', { user: req.session.user, notes: [], error: 'Failed to fetch notes.', editing: false, errors: [] }); // Handle error
    }
});

app.post('/profile/edit', isLoggedIn, [
    body('username').trim().isLength({ min: 3, max: 20 }).withMessage('Username must be between 3 and 20 characters'),
    body('firstName').trim().isLength({ max: 50 }).withMessage('First name cannot be longer than 50 characters'),
    body('lastName').trim().isLength({ max: 50 }).withMessage('Last name cannot be longer than 50 characters'),
    body('location').trim().isLength({ max: 50 }).withMessage('Location cannot be longer than 50 characters'),
    body('website').trim().isURL().withMessage('Website must be a valid URL').optional({ nullable: true, checkFalsy: true }),
    body('bio').trim().isLength({ max: 200 }).withMessage('Bio cannot be longer than 200 characters')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            // If there are validation errors, re-render the profile page with the errors
            const notes = await Note.find({ userId: req.session.userId }); // Fetch notes
            const user = await User.findById(req.session.userId).lean()
            return res.render('profile', { 
                user: user, 
                notes: notes, 
                editing: true, 
                errors: errors.array() // Pass the errors to the view
            });
        }

        const { username, firstName, lastName, location, website, bio } = req.body;
        const userId = req.session.userId;

        // Find the user
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).send('User not found');
        }

        // Update the user's information
        user.username = username;
        user.firstName = firstName;
        user.lastName = lastName;
        user.location = location;
        user.website = website;
        user.bio = bio;

        // Save the updated user
        await user.save();

        // Update the session as well
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

        // Redirect back to the profile page
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

        // Update the user's profile picture
        user.profilePicture = '/images/default-profile.png';  // Save the file path to the database
        await user.save();

        // Update the session
        req.session.user.profilePicture = user.profilePicture;

        res.redirect('/profile');
    } catch (error) {
        console.error('Error uploading profile picture:', error);
        res.status(500).send('An error occurred while uploading the profile picture.');
    }
});

app.post('/profile/upload', isLoggedIn, upload.single('profilePicture'), async (req, res) => {
    try {
        const userId = req.session.userId;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).send('User not found');
        }
         // Check if a file was uploaded
        if (!req.file) {
            // Handle the case where no file was uploaded
            console.log('No file uploaded');
            return res.redirect('/profile');
        }

        // Update the user's profile picture
        user.profilePicture = '/uploads/' + req.file.filename;  // Save the file path to the database
        await user.save();

        // Update the session
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
        console.error('Error uploading profile picture:', error);
        res.status(500).send('An error occurred while uploading the profile picture.');
    }
});

app.get('/', (req, res) => {
    if (req.session.userId) {
        // User is logged in, render the main page
        res.render('main', { user: req.session.user });
    } else {
        // User is not logged in, render the index page
        res.render('index');
    }
});

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});