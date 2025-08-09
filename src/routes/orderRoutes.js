// const express = require('express');
// const router = express.Router();
// const orderController = require('../controllers/orderController');
// // const authMiddleware = require('../middleware/authMiddleware'); // Uncomment to protect routes

// // All routes are prefixed with /api/orders

// /**
//  * @route   POST /api/orders
//  * @desc    Create a new order and deduct inventory
//  * @access  Private
//  */
// router.post('/', orderController.createOrder);

// /**
//  * @route   GET /api/orders
//  * @desc    Get orders with filtering and pagination.
//  * @access  Private
//  * @example
//  * // Get all orders for a specific party
//  * GET /api/orders?party_id=60d...
//  *
//  * // Get all orders for a specific factory
//  * GET /api/orders?factory_id=60e...
//  *
//  * // Get all orders within a date range
//  * GET /api/orders?startDate=2025-01-01&endDate=2025-01-31
//  *
//  * // Get all orders for a specific party within a date range
//  * GET /api/orders?party_id=60d...&startDate=2025-01-01&endDate=2025-01-31
//  *
//  * // Use pagination
//  * GET /api/orders?page=2&limit=10
//  */
// router.get('/', orderController.getOrders);

// /**
//  * @route   PUT /api/orders/:id
//  * @desc    Edit non-inventory details of an order
//  * @access  Private
//  */
// router.put('/:id', orderController.editOrder);

// /**
//  * @route   DELETE /api/orders/:id
//  * @desc    Soft delete an order and restore inventory
//  * @access  Private
//  */
// router.delete('/:id', orderController.deleteOrder);

// router.get('/stats/pallets', orderController.getPalletStats);


// module.exports = router;


const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
// const authMiddleware = require('../middleware/authMiddleware'); // You can add this later for protection

// All routes in this file are prefixed with /api/orders

// --- ADD THIS NEW ROUTE ---
// @route   POST /api/orders
// @desc    Create a new order (and update inventory if applicable)
// @access  Private
router.post('/', orderController.addOrder);

router.get('/', orderController.getOrders);


// --- Your existing routes ---

// @route   GET /api/orders/stats/pallets
// @desc    Get aggregated pallet usage statistics
// @access  Private
router.get('/stats/pallets', orderController.getPalletStats);

// @route   GET /api/orders
// @desc    Get a list of orders with optional filters
// @access  Private
// router.get('/', orderController.getOrders);

// You can add other routes for updating, deleting, etc. here later
// For example:
// router.put('/:id', orderController.editOrder);
// router.delete('/:id', orderController.deleteOrder);

router.get('/:id', orderController.getOrderById);

router.delete('/:id', orderController.deleteOrder);

router.get('/search/:customId', orderController.findOrderByCustomId);





module.exports = router;
