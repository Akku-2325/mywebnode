const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', authMiddleware.isLoggedIn, orderController.getAllOrders); // Require login
router.get('/:id', authMiddleware.isLoggedIn, orderController.getOrderById); // Require login
router.post('/', authMiddleware.isLoggedIn, orderController.createOrder);   // Require login
router.put('/:id', authMiddleware.isLoggedIn, orderController.updateOrder);   // Require login
router.delete('/:id', authMiddleware.isLoggedIn, orderController.deleteOrder); // Require login

module.exports = router;