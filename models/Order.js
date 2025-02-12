const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [{
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        quantity: { type: Number, default: 1 }
    }],
    totalAmount: { type: Number, required: true },
    shippingAddress: { type: String }, // Or an object for more complex addresses
    orderDate: { type: Date, default: Date.now },
    status: { type: String, enum: ['pending', 'processing', 'shipped', 'delivered'], default: 'pending' }
});

module.exports = mongoose.model('Order', orderSchema);