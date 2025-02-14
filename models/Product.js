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

    // Jewelry-Specific Attributes
    metalType: { type: String }, // e.g., "Gold", "Silver", "Platinum"
    gemstone: { type: String },  // e.g., "Diamond", "Sapphire", "Emerald"
    gemstoneColor: { type: String }, // e.g., "Blue", "Red", "Green"
    gemstoneCarat: { type: Number }, // e.g., 1.0, 0.5, 2.5
    style: { type: String },    // e.g., "Vintage", "Modern", "Art Deco"
    jewelryType: {type: String }, //e.g. "Necklace", "Ring", "Earrings", "Bracelet"
    size: { type: String },     // e.g., "7", "8", "Adjustable" (for rings/bracelets)
    weight: { type: Number },   // Weight in grams
    // New Attributes
    brand: {type: String },
    collection: {type: String},
    isCustomizable: {type: Boolean, default: false},
    // Дополнительные характеристики:
    specifications: { // Дополнительные характеристики
        color: String,
        size: String,
        // Другие характеристики по необходимости
    },
    tags: [{ type: String }],      // For free-form keywords
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
    }]

});

// Add text index with weights
productSchema.index(
  {
    name: 'text',
    description: 'text',
    metalType: 'text',
    gemstone: 'text',
    style: 'text',
    jewelryType: 'text',
    brand: 'text',
    collection: 'text',
    tags: 'text'
  },
  {
    weights: {
      name: 5,
      description: 3,
      metalType: 4,
      gemstone: 4,
      style: 2,
      jewelryType: 3,
      brand: 2,
      collection: 2,
      tags: 1
    },
    name: 'TextIndex' // Имя индекса
  }
);

// Индексы для фильтрации и сортировки
productSchema.index({ category: 1 }); // Индекс для поля category
productSchema.index({ price: 1 }); // Индекс для поля price
productSchema.index({ metalType: 1 });
productSchema.index({ gemstone: 1 });
productSchema.index({ style: 1 });
productSchema.index({ jewelryType: 1 });
productSchema.index({ brand: 1 });
productSchema.index({ collection: 1 });
productSchema.index({weight: 1})

module.exports = mongoose.model('Product', productSchema);