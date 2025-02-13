const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    description: { type: String },

    // Новые поля:
    imageUrl: { type: String }, // URL изображения категории
    order: { type: Number, default: 0 } // Порядок отображения категорий
});

module.exports = mongoose.model('Category', categorySchema);