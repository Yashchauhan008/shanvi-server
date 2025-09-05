const Factory = require('../models/factorySchema');
const Party = require('../models/partySchema');
const mongoose = require('mongoose');

/**
 * @desc    Create a new factory and associate it with a party
 * @route   POST /api/factories
 * @access  Private
 */
exports.createFactory = async (req, res) => {
  const { name, party_id } = req.body;

  // 1. Validation: Ensure all required fields are present.
  if (!name || !party_id) {
    return res.status(400).json({ message: 'Factory name and party ID are required.' });
  }

  // 2. Validate the provided party_id.
  if (!mongoose.Types.ObjectId.isValid(party_id)) {
    return res.status(400).json({ message: 'Invalid Party ID format.' });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 3. Check if the specified party actually exists.
    const party = await Party.findById(party_id).session(session);
    if (!party) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'Party not found. Cannot create factory.' });
    }

    // 4. Create the new factory.
    const newFactory = new Factory({
      name,
      party_id,
    });
    await newFactory.save({ session });

    // 5. Atomically add the new factory's ID to the party's factory_ids array.
    party.factory_ids.push(newFactory._id);
    await party.save({ session });

    // 6. Commit the transaction if all operations were successful.
    await session.commitTransaction();
    session.endSession();

    res.status(201).json({ message: 'Factory created and linked to party successfully', data: newFactory });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Error creating factory:', error);
    // Check for duplicate key errors if you add a unique index on name+party_id
    if (error.code === 11000) {
        return res.status(409).json({ error: 'This factory name already exists for the specified party.' });
    }
    res.status(500).json({ error: 'Failed to create factory due to a server error.' });
  }
};

/**
 * @desc    Get all factories
 * @route   GET /api/factories
 * @access  Private
 */
exports.getAllFactories = async (req, res) => {
  try {
    // Populate the 'party_id' field to show the party's name instead of just its ID
    const factories = await Factory.find().populate('party_id', 'name');
    res.status(200).json(factories);
  } catch (error) {
    console.error('Error fetching factories:', error);
    res.status(500).json({ error: 'Failed to fetch factories.' });
  }
};

/**
 * @desc    Get a single factory by its ID
 * @route   GET /api/factories/:id
 * @access  Private
 */
exports.getFactoryById = async (req, res) => {
    try {
        const factory = await Factory.findById(req.params.id).populate('party_id', 'name');
        if (!factory) {
            return res.status(404).json({ message: 'Factory not found.' });
        }
        res.status(200).json(factory);
    } catch (error) {
        console.error('Error fetching factory:', error);
        res.status(500).json({ error: 'Failed to fetch factory.' });
    }
};

/**
 * @desc    Update a factory's details
 * @route   PUT /api/factories/:id
 * @access  Private
 */
exports.updateFactory = async (req, res) => {
  const { id } = req.params;
  const { name } = req.body; // Only allow updating the name, party_id should not be changed.

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid factory ID format.' });
  }

  try {
    const updatedFactory = await Factory.findByIdAndUpdate(
      id,
      { name }, // Only update the name
      { new: true, runValidators: true }
    );

    if (!updatedFactory) {
      return res.status(404).json({ error: 'Factory not found.' });
    }

    res.status(200).json({ message: 'Factory updated successfully', data: updatedFactory });
  } catch (error) {
    console.error('Error updating factory:', error);
    res.status(500).json({ error: 'Failed to update factory.' });
  }
};

/**
 * @desc    Delete a factory
 * @route   DELETE /api/factories/:id
 * @access  Private
 */
exports.deleteFactory = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid factory ID format.' });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Find the factory to be deleted to get its party_id
    const factory = await Factory.findById(id).session(session);
    if (!factory) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ error: 'Factory not found.' });
    }

    // 2. Remove the factory's ID from the associated party's factory_ids array
    await Party.findByIdAndUpdate(
      factory.party_id,
      { $pull: { factory_ids: factory._id } },
      { session }
    );

    // 3. Delete the factory itself
    await Factory.findByIdAndDelete(id).session(session);

    // 4. Commit the transaction
    await session.commitTransaction();
    session.endSession();

    res.status(200).json({ message: 'Factory deleted successfully and unlinked from party.' });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Error deleting factory:', error);
    res.status(500).json({ error: 'Failed to delete factory.' });
  }
};
