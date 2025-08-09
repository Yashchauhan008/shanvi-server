const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
// const authMiddleware = require('../middleware/authMiddleware'); // Protect this route

// All routes here are prefixed with /api/reports
router.get('/orders', /* authMiddleware, */ reportController.generateOrderReport);

module.exports = router;
