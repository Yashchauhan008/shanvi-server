const express = require('express');
const router = express.Router();
const factoryController = require('../controllers/factoryController');
// const authMiddleware = require('../middleware/authMiddleware'); // Uncomment to add authentication

// All routes are prefixed with /api/factories (as defined in your main server file)

// POST /api/factories - Create a new factory
router.post('/', factoryController.createFactory);

// GET /api/factories - Get all factories
router.get('/', factoryController.getAllFactories);

// GET /api/factories/:id - Get a single factory by ID
router.get('/:id', factoryController.getFactoryById);

// PUT /api/factories/:id - Update a factory's name
router.put('/:id', factoryController.updateFactory);

// DELETE /api/factories/:id - Delete a factory
router.delete('/:id', factoryController.deleteFactory);

module.exports = router;
