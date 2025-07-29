const express = require('express');
const router = express.Router();
const palletController = require('../controllers/palletController');
// const authMiddleware = require('../middleware/authMiddleware'); // You can add this later for protection

// All routes are prefixed with /api/pallets (defined in your main server file)

// POST /api/pallets - Create a new pallet
router.post('/', palletController.createPallet);

// GET /api/pallets - Get all pallets
router.get('/', palletController.getAllPallets);

// PUT /api/pallets/:id - Update a pallet by ID
router.put('/:id', palletController.updatePallet);

// DELETE /api/pallets/:id - Delete a pallet by ID
router.delete('/:id', palletController.deletePallet);

module.exports = router;
