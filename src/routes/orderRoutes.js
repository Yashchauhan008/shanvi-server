const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
// const authMiddleware = require('../middleware/authMiddleware'); // Uncomment to protect routes

// All routes are prefixed with /api/orders

/**
 * @route   POST /api/orders
 * @desc    Create a new order and deduct inventory
 * @access  Private
 */
router.post('/', orderController.createOrder);

/**
 * @route   GET /api/orders
 * @desc    Get orders with filtering and pagination.
 * @access  Private
 * @example
 * // Get all orders for a specific party
 * GET /api/orders?party_id=60d...
 *
 * // Get all orders for a specific factory
 * GET /api/orders?factory_id=60e...
 *
 * // Get all orders within a date range
 * GET /api/orders?startDate=2025-01-01&endDate=2025-01-31
 *
 * // Get all orders for a specific party within a date range
 * GET /api/orders?party_id=60d...&startDate=2025-01-01&endDate=2025-01-31
 *
 * // Use pagination
 * GET /api/orders?page=2&limit=10
 */
router.get('/', orderController.getOrders);

/**
 * @route   PUT /api/orders/:id
 * @desc    Edit non-inventory details of an order
 * @access  Private
 */
router.put('/:id', orderController.editOrder);

/**
 * @route   DELETE /api/orders/:id
 * @desc    Soft delete an order and restore inventory
 * @access  Private
 */
router.delete('/:id', orderController.deleteOrder);

module.exports = router;
