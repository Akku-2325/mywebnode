const express = require('express');
const router = express.Router();
const Setting = require('../models/Setting');
const upload = require('../middleware/uploadMiddleware');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier'); // Import streamifier
const authMiddleware = require('../middleware/authMiddleware');

// Cloudinary configuration
cloudinary.config({
    cloud_name: 'dcntjvbad',
    api_key: '524554154549779',
    api_secret: 's-g5LOm50e0R8T8YLn7NKuj-ezk'
});

// Apply auth middleware to all admin routes
router.use(authMiddleware.isLoggedIn, authMiddleware.isAdmin);

// Отображение формы для редактирования настроек
router.get('/settings', async (req, res) => {
    try {
        const bannerSetting = await Setting.findOne({ key: 'bannerImageUrl' });
        const bannerImageUrl = bannerSetting ? bannerSetting.value : '';
        res.render('admin/settings', { bannerImageUrl: bannerImageUrl });
    } catch (error) {
        console.error('Error fetching settings:', error);
        res.status(500).send('Error fetching settings.');
    }
});

// Обработка сохранения настроек
router.post('/settings', upload.single('bannerImage'), async (req, res) => {
  try {
    let bannerImageUrl = req.body.existingBannerImageUrl;

    if (req.file) {
      // Upload to Cloudinary using streams
      const streamUpload = (req) => {
        return new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            (error, result) => {
              if (error) {
                console.log("Cloudinary Error", error);
                return reject(error);
              }
              resolve(result);
            }
          );

          streamifier.createReadStream(req.file.buffer).pipe(stream);
        });
      };

      const result = await streamUpload(req);
      bannerImageUrl = result.secure_url;
    }

    // Обновляем или создаем настройку
    await Setting.findOneAndUpdate(
      { key: 'bannerImageUrl' },
      { value: bannerImageUrl },
      { upsert: true, new: true }
    );

    res.redirect('/admin/settings');
  } catch (error) {
    console.error('Error saving settings:', error);
    res.status(500).send('Error saving settings.');
  }
});

module.exports = router;