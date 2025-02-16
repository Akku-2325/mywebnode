const express = require('express');
const router = express.Router();
const Setting = require('../models/Setting');
const upload = require('../middleware/uploadMiddleware'); // Middleware для загрузки файлов
const cloudinary = require('cloudinary').v2; // Cloudinary

// Cloudinary configuration
cloudinary.config({
  cloud_name: 'your_cloud_name',
  api_key: 'your_api_key',
  api_secret: 'your_api_secret'
});

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
        let bannerImageUrl = req.body.existingBannerImageUrl; // Сохраняем старый URL

        // Если загружено новое изображение
        if (req.file) {
            // Upload to Cloudinary
            const result = await cloudinary.uploader.upload(req.file.path);
            bannerImageUrl = result.secure_url; // Get the new URL from Cloudinary
        }

        // Обновляем или создаем настройку
        await Setting.findOneAndUpdate(
            { key: 'bannerImageUrl' },
            { value: bannerImageUrl },
            { upsert: true, new: true } // Создать, если не существует, и вернуть обновленный документ
        );

        res.redirect('/admin/settings'); // Перенаправляем обратно к форме
    } catch (error) {
        console.error('Error saving settings:', error);
        res.status(500).send('Error saving settings.');
    }
});

module.exports = router;