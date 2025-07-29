const Party = require('../models/partySchema'); // Ensure path is correct
const mongoose = require('mongoose');

/**
 * @desc    Create a new party
 * @route   POST /api/parties
 * @access  Private
 */
exports.createParty = async (req, res) => {
  // Only the 'name' is expected from the request body.
  const { name } = req.body;

  // 1. Validation: Ensure name is provided.
  if (!name || name.trim() === '') {
    return res.status(400).json({ message: 'Party name is required and cannot be empty.' });
  }

  try {
    // 2. Check for duplicates to maintain data integrity.
    const existingParty = await Party.findOne({ name });
    if (existingParty) {
      return res.status(409).json({ message: `A party with the name '${name}' already exists.` }); // 409 Conflict
    }

    // 3. Create a new party instance.
    // The 'factory_ids' field will automatically be an empty array by default.
    const newParty = new Party({
      name,
    });

    // 4. Save the new party to the database.
    await newParty.save();

    // 5. Respond with the newly created party data.
    res.status(201).json({ message: 'Party created successfully', data: newParty });

  } catch (error) {
    console.error('Error creating party:', error);
    res.status(500).json({ error: 'Failed to create party due to a server error.' });
  }
};

/**
 * @desc    Get a lightweight list of all parties (id and name only) for dropdowns
 * @route   GET /api/parties/list
 * @access  Private
 */
exports.getPartyList = async (req, res) => {
  try {
    // .select('_id name') tells MongoDB to only return these two fields.
    const partyList = await Party.find().select('_id name').sort({ name: 1 });
    res.status(200).json(partyList);
  } catch (error) {
    console.error('Error fetching party list:', error);
    res.status(500).json({ error: 'Failed to fetch party list.' });
  }
};

/**
 * @desc    Get all parties, optionally populating factory details
 * @route   GET /api/parties
 * @access  Private
 */
exports.getAllParties = async (req, res) => {
  try {
    const parties = await Party.find().populate('factory_ids', 'name');
    res.status(200).json(parties);
  } catch (error) {
    console.error('Error fetching parties:', error);
    res.status(500).json({ error: 'Failed to fetch parties.' });
  }
};

/**
 * @desc    Get a single party by its ID
 * @route   GET /api/parties/:id
 * @access  Private
 */
exports.getPartyById = async (req, res) => {
    try {
        const party = await Party.findById(req.params.id).populate('factory_ids', 'name');
        if (!party) {
            return res.status(404).json({ message: 'Party not found.' });
        }
        res.status(200).json(party);
    } catch (error) {
        console.error('Error fetching party by ID:', error);
        res.status(500).json({ error: 'Failed to fetch party.' });
    }
};

/**
 * @desc    Update an existing party (can be used to add/remove factory_ids)
 * @route   PUT /api/parties/:id
 * @access  Private
 */
exports.updateParty = async (req, res) => {
  const { id } = req.params;
  const { name, factory_ids } = req.body; // Update can still modify name and factories

  if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid party ID format.' });
  }

  try {
    const updatedParty = await Party.findByIdAndUpdate(
      id,
      { name, factory_ids },
      { new: true, runValidators: true }
    );

    if (!updatedParty) {
      return res.status(404).json({ error: 'Party not found.' });
    }

    res.status(200).json({ message: 'Party updated successfully', data: updatedParty });
  } catch (error) {
    console.error('Error updating party:', error);
    res.status(500).json({ error: 'Failed to update party.' });
  }
};

/**
 * @desc    Delete a party
 * @route   DELETE /api/parties/:id
 * @access  Private
 */
exports.deleteParty = async (req, res) => {
  const { id } = req.params;

   if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid party ID format.' });
  }

  try {
    const deletedParty = await Party.findByIdAndDelete(id);
    if (!deletedParty) {
      return res.status(404).json({ error: 'Party not found.' });
    }
    res.status(200).json({ message: 'Party deleted successfully.' });
  } catch (error) {
    console.error('Error deleting party:', error);
    res.status(500).json({ error: 'Failed to delete party.' });
  }
};
