const express = require('express');
const router = express.Router();
const partyController = require('../controllers/partyController');
// const authMiddleware = require('../middleware/authMiddleware'); // Uncomment to add authentication

// All routes in this file are prefixed with /api/parties (defined in your main server file)

// POST /api/parties - Create a new party
router.post('/', partyController.createParty);

// GET /api/parties - Get all parties
router.get('/', partyController.getAllParties);

// GET /api/parties/:id - Get a single party by ID
router.get('/:id', partyController.getPartyById);

// PUT /api/parties/:id - Update a party by ID
router.put('/:id', partyController.updateParty);

// DELETE /api/parties/:id - Delete a party by ID
router.delete('/:id', partyController.deleteParty);

// This route specifically fetches a simple list for forms.
router.get('/list', partyController.getPartyList);

/*
// If you want to protect all routes:
router.use(authMiddleware);
router.post('/', partyController.createParty);
router.get('/', partyController.getAllParties);
router.get('/:id', partyController.getPartyById);
router.put('/:id', partyController.updateParty);
router.delete('/:id', partyController.deleteParty);
*/

module.exports = router;
