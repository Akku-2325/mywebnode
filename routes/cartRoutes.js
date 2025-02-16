const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

router.get('/addToCart/:productId', async (req, res) => {
    console.log(req.session)
    const productId = req.params.productId;
    console.log("addToCart route called with productId:", productId); // <--  ВАЖНО!
    try {
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).send('Product not found');
        }

        // Get the cart from the session
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

        // Save the cart in the session
        req.session.cart = cart;

        // Redirect to the cart page or back to the product listing
        res.redirect('/cart');
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