const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    images: [{ type: String }], // Array of image URLs
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' }, // Reference to Category model
    material: { type: String },
    stock: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },

    // Новые поля:
    tags: [{ type: String }], // Массив тегов для поиска
    dimensions: { // Размеры продукта (если применимо)
        width: Number,
        height: Number,
        depth: Number
    },
    reviews: [{ // Отзывы о продукте
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        rating: { type: Number, min: 1, max: 5 }, // Оценка от 1 до 5
        comment: String,
        createdAt: { type: Date, default: Date.now }
    }],
    specifications: { // Дополнительные характеристики
        color: String,
        size: String,
        // Другие характеристики по необходимости
    }
});

// Добавляем индекс для текстового поиска
productSchema.index({ name: 'text', description: 'text', tags: 'text' });
productSchema.index({ category: 1 }); // Индекс для поля category
productSchema.index({ price: 1 }); // Индекс для поля price

module.exports = mongoose.model('Product', productSchema);