const express = require('express');
const router = express.Router();
const partyController = require('../controllers/partyController');

// --- THE FIX IS HERE: The '/list' route MUST come before the '/:id' route. ---

// @route   GET /api/parties/list
// @desc    Get a lightweight list of parties for forms
router.get('/list', partyController.getPartyList);

// @route   POST /api/parties
// @desc    Create a new party
router.post('/', partyController.createParty);

// @route   GET /api/parties
// @desc    Get all parties (This is different from the list)
router.get('/', partyController.getAllParties);

// @route   GET /api/parties/:id
// @desc    Get a single party by ID
// This route is now correctly placed after the more specific '/list' route.
router.get('/:id', partyController.getPartyById);

// @route   PUT /api/parties/:id
// @desc    Update a party by ID
router.put('/:id', partyController.updateParty);

// @route   DELETE /api/parties/:id
// @desc    Delete a party by ID
router.delete('/:id', partyController.deleteParty);

module.exports = router;
