const mongoose = require('mongoose');

const SettingSchema = new mongoose.Schema({
    key: { type: String, required: true, unique: true }, // Ключ настройки (например, 'bannerImageUrl')
    value: {
        type: String,
        required: true,
        default: '/banner/default-banner.jpg' // URL-адрес изображения по умолчанию
    } // Значение настройки (URL-адрес изображения)
});

module.exports = mongoose.model('Setting', SettingSchema);