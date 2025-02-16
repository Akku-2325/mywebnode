const express = require('express');
const router = express.Router();
const Setting = require('../models/Setting');
// Маршрут для главной страницы
router.get('/', async (req, res) => {
    try {
        const bannerSetting = await Setting.findOne({ key: 'bannerImageUrl' });
        const bannerImageUrl = bannerSetting ? bannerSetting.value : '/images/default-banner.jpg'; // Default URL
        res.render('main', { user: req.session.user, bannerImageUrl: bannerImageUrl });
    } catch (error) {
        console.error('Error fetching banner image URL:', error);
        res.render('main', { user: req.session.user, bannerImageUrl: '/images/default-banner.jpg' }); // Default URL
    }
});

module.exports = router;