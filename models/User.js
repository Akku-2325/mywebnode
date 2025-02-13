const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    username: { type: String, required: true },
    firstName: { type: String, default: '' },
    lastName: { type: String, default: '' },
    location: { type: String, default: '' },
    website: { type: String, default: '' },
    bio: { type: String, default: '' },
    profilePicture: { type: String, default: '/images/default-profile.png' }, // Store the path to the profile picture
    loginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },

    // New fields for 2FA:
    twoFASecret: { type: String }, // Store the 2FA secret key
    is2FAEnabled: { type: Boolean, default: false } // Track whether 2FA is enabled
});