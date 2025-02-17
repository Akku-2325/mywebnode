const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { requireAuth } = require('../middleware/authMiddleware'); // Import the authentication middleware

router.post('/cart/:productId', requireAuth, async (req, res) => {
    try {
        const productId = req.params.productId;
        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).send('Product not found');
        }

        let cart = req.session.cart || [];

        // Check if the product is already in the cart
        const existingProductIndex = cart.findIndex(item => item.product._id.toString() === productId);

        if (existingProductIndex > -1) {
            // If the product exists in the cart, increment the quantity
            cart[existingProductIndex].quantity += 1;
        } else {
            // If the product doesn't exist in the cart, add it
            cart.push({ product: product, quantity: 1 });
        }

        req.session.cart = cart;
        req.session.save(err => {
            if (err) {
                console.error('Error saving session:', err);
                return res.status(500).send('Error saving session');
            }
            res.redirect('/cart');
        });
    } catch (error) {
        console.error('Error adding to cart:', error);
        res.status(500).send('Error adding to cart');
    }
});

router.get('/', (req, res) => {
    const cart = req.session.cart || [];
    let total = 0;
    cart.forEach(item => {
        total += item.product.price * item.quantity;
    });
    res.render('cart', { cart: cart, total: total });
});

module.exports = router;