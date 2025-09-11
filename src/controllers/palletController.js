// const Pallet = require('../models/palletSchema');
// const mongoose = require('mongoose');

// /**
//  * @desc    Create a new pallet
//  * @route   POST /api/pallets
//  * @access  Private
//  */
// exports.createPallet = async (req, res) => {
//   const { name } = req.body;

//   if (!name) {
//     return res.status(400).json({ message: 'Pallet name is required.' });
//   }

//   try {
//     const newPallet = new Pallet({ name });
//     await newPallet.save();
//     res.status(201).json({ message: 'Pallet created successfully.', data: newPallet });
//   } catch (error) {
//     // This will catch the 'unique' index error if a duplicate is created
//     if (error.code === 11000) {
//       return res.status(409).json({ message: `A pallet with the name '${name}' already exists.` });
//     }
//     console.error('Create Pallet Error:', error);
//     res.status(500).json({ error: 'Failed to create pallet.' });
//   }
// };

// /**
//  * @desc    Get all pallets
//  * @route   GET /api/pallets
//  * @access  Private
//  */
// exports.getAllPallets = async (req, res) => {
//   try {
//     // Sort by name alphabetically
//     const pallets = await Pallet.find().sort({ name: 1 });
//     res.status(200).json(pallets);
//   } catch (error) {
//     console.error('Get All Pallets Error:', error);
//     res.status(500).json({ error: 'Failed to fetch pallets.' });
//   }
// };

// /**
//  * @desc    Update a pallet's name
//  * @route   PUT /api/pallets/:id
//  * @access  Private
//  */
// exports.updatePallet = async (req, res) => {
//   const { id } = req.params;
//   const { name } = req.body;

//   if (!mongoose.Types.ObjectId.isValid(id)) {
//     return res.status(400).json({ message: 'Invalid pallet ID.' });
//   }
//   if (!name) {
//     return res.status(400).json({ message: 'Pallet name is required.' });
//   }

//   try {
//     const updatedPallet = await Pallet.findByIdAndUpdate(id, { name }, { new: true, runValidators: true });
//     if (!updatedPallet) {
//       return res.status(404).json({ message: 'Pallet not found.' });
//     }
//     res.status(200).json({ message: 'Pallet updated successfully.', data: updatedPallet });
//   } catch (error) {
//     if (error.code === 11000) {
//       return res.status(409).json({ message: `A pallet with the name '${name}' already exists.` });
//     }
//     console.error('Update Pallet Error:', error);
//     res.status(500).json({ error: 'Failed to update pallet.' });
//   }
// };

// /**
//  * @desc    Delete a pallet
//  * @route   DELETE /api/pallets/:id
//  * @access  Private
//  */
// exports.deletePallet = async (req, res) => {
//   const { id } = req.params;

//   if (!mongoose.Types.ObjectId.isValid(id)) {
//     return res.status(400).json({ message: 'Invalid pallet ID.' });
//   }

//   try {
//     const deletedPallet = await Pallet.findByIdAndDelete(id);
//     if (!deletedPallet) {
//       return res.status(404).json({ message: 'Pallet not found.' });
//     }
//     res.status(200).json({ message: 'Pallet deleted successfully.' });
//   } catch (error) {
//     console.error('Delete Pallet Error:', error);
//     res.status(500).json({ error: 'Failed to delete pallet.' });
//   }
// };


const Pallet = require('../models/palletSchema');
const mongoose = require('mongoose');
const logger = require('../logger'); // 1. Import the logger

/**
 * @desc    Create a new pallet
 * @route   POST /api/pallets
 * @access  Private
 */
exports.createPallet = async (req, res) => {
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ message: 'Pallet name is required.' });
  }

  try {
    const newPallet = new Pallet({ name });
    await newPallet.save();

    // --- Logging ---
    logger.info(`Pallet size created: '${newPallet.name}' (ID: ${newPallet._id})`);

    res.status(201).json({ message: 'Pallet created successfully.', data: newPallet });
  } catch (error) {
    // --- Logging ---
    if (error.code === 11000) {
      logger.warn(`Attempted to create duplicate pallet size: '${name}'`);
      return res.status(409).json({ message: `A pallet with the name '${name}' already exists.` });
    }
    logger.error(`Failed to create pallet size '${name}': ${error.message}`);
    
    res.status(500).json({ error: 'Failed to create pallet.' });
  }
};

/**
 * @desc    Get all pallets
 * @route   GET /api/pallets
 * @access  Private
 */
exports.getAllPallets = async (req, res) => {
  try {
    const pallets = await Pallet.find().sort({ name: 1 });

    // --- Logging ---
    logger.info('Successfully retrieved all pallet sizes.');

    res.status(200).json(pallets);
  } catch (error) {
    // --- Logging ---
    logger.error(`Failed to fetch all pallet sizes: ${error.message}`);

    res.status(500).json({ error: 'Failed to fetch pallets.' });
  }
};

/**
 * @desc    Update a pallet's name
 * @route   PUT /api/pallets/:id
 * @access  Private
 */
exports.updatePallet = async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid pallet ID.' });
  }
  if (!name) {
    return res.status(400).json({ message: 'Pallet name is required.' });
  }

  try {
    const updatedPallet = await Pallet.findByIdAndUpdate(id, { name }, { new: true, runValidators: true });
    if (!updatedPallet) {
      // --- Logging ---
      logger.warn(`Attempted to update non-existent pallet size with ID: ${id}`);
      return res.status(404).json({ message: 'Pallet not found.' });
    }

    // --- Logging ---
    logger.info(`Pallet size updated: '${updatedPallet.name}' (ID: ${id})`);

    res.status(200).json({ message: 'Pallet updated successfully.', data: updatedPallet });
  } catch (error) {
    // --- Logging ---
    if (error.code === 11000) {
      logger.warn(`Attempted to update pallet size to a duplicate name: '${name}'`);
      return res.status(409).json({ message: `A pallet with the name '${name}' already exists.` });
    }
    logger.error(`Failed to update pallet size with ID ${id}: ${error.message}`);
    
    res.status(500).json({ error: 'Failed to update pallet.' });
  }
};

/**
 * @desc    Delete a pallet
 * @route   DELETE /api/pallets/:id
 * @access  Private
 */
exports.deletePallet = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid pallet ID.' });
  }

  try {
    const deletedPallet = await Pallet.findByIdAndDelete(id);
    if (!deletedPallet) {
      // --- Logging ---
      logger.warn(`Attempted to delete non-existent pallet size with ID: ${id}`);
      return res.status(404).json({ message: 'Pallet not found.' });
    }

    // --- Logging ---
    logger.info(`Pallet size deleted: '${deletedPallet.name}' (ID: ${id})`);

    res.status(200).json({ message: 'Pallet deleted successfully.' });
  } catch (error) {
    // --- Logging ---
    logger.error(`Failed to delete pallet size with ID ${id}: ${error.message}`);
    
    res.status(500).json({ error: 'Failed to delete pallet.' });
  }
};
