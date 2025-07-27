const express = require('express');
const router = express.Router();
const productionHouseController = require('../controllers/productionHouseController');
// Optional: Middleware for protecting routes
// const authMiddleware = require('../middleware/authMiddleware');

// @route   POST api/production-house/register
// @desc    Register a new production house
// @access  Public
router.post('/register', productionHouseController.registerNewProductionHouse);

// @route   POST api/production-house/login
// @desc    Login for a production house
// @access  Public
router.post('/login', productionHouseController.login);

// @route   GET api/production-house/:id
// @desc    Get production house details by ID
// @access  Private (example: protected by auth middleware)
// For a protected route, you would add middleware like this:
// router.get('/:id', authMiddleware, productionHouseController.getProductionHouseByID);
router.get('/:id', productionHouseController.getProductionHouseByID);


module.exports = router;
