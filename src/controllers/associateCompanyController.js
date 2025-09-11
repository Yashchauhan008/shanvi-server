const AssociateCompany = require('../models/associateCompanySchema');
const mongoose = require('mongoose');
const logger = require('../logger'); // 1. Import the logger

/**
 * @desc    Create a new Associate Company
 * @route   POST /api/associate-companies
 * @access  Private
 */
exports.createAssociateCompany = async (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ message: 'Company name is required.' });
  }

  try {
    const newCompany = new AssociateCompany({ name });
    await newCompany.save();
    
    // --- Logging ---
    logger.info(`Associate Company created: ${newCompany.name} (ID: ${newCompany._id})`);
    
    res.status(201).json({ message: 'Associate Company created successfully.', data: newCompany });
  } catch (error) {
    // --- Logging ---
    if (error.code === 11000) {
      logger.warn(`Attempted to create duplicate Associate Company: '${name}'`);
      return res.status(409).json({ message: `An Associate Company with the name '${name}' already exists.` });
    }
    logger.error(`Failed to create Associate Company '${name}': ${error.message}`);
    
    res.status(500).json({ error: 'Failed to create Associate Company.' });
  }
};

/**
 * @desc    Get all Associate Companies
 * @route   GET /api/associate-companies
 * @access  Private
 */
exports.getAllAssociateCompanies = async (req, res) => {
  try {
    const companies = await AssociateCompany.find().sort({ name: 1 });
    
    // --- Logging ---
    logger.info('Successfully retrieved all Associate Companies.');
    
    res.status(200).json(companies);
  } catch (error) {
    // --- Logging ---
    logger.error(`Failed to fetch all Associate Companies: ${error.message}`);
    
    res.status(500).json({ error: 'Failed to fetch Associate Companies.' });
  }
};

/**
 * @desc    Get a single Associate Company by its ID
 * @route   GET /api/associate-companies/:id
 * @access  Private
 */
exports.getAssociateCompanyById = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid Company ID format.' });
  }

  try {
    const company = await AssociateCompany.findById(id);
    if (!company) {
      // --- Logging ---
      logger.warn(`Associate Company not found for ID: ${id}`);
      return res.status(404).json({ message: 'Associate Company not found.' });
    }
    
    // --- Logging ---
    logger.info(`Successfully retrieved Associate Company: ${company.name} (ID: ${id})`);
    
    res.status(200).json(company);
  } catch (error) {
    // --- Logging ---
    logger.error(`Failed to fetch Associate Company with ID ${id}: ${error.message}`);
    
    res.status(500).json({ error: 'Failed to fetch Associate Company.' });
  }
};

/**
 * @desc    Update an Associate Company's name
 * @route   PUT /api/associate-companies/:id
 * @access  Private
 */
exports.updateAssociateCompany = async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid ID.' });
  }
  if (!name) {
    return res.status(400).json({ message: 'Company name is required.' });
  }

  try {
    const updatedCompany = await AssociateCompany.findByIdAndUpdate(id, { name }, { new: true, runValidators: true });
    if (!updatedCompany) {
      // --- Logging ---
      logger.warn(`Attempted to update non-existent Associate Company with ID: ${id}`);
      return res.status(404).json({ message: 'Associate Company not found.' });
    }
    
    // --- Logging ---
    logger.info(`Associate Company updated: ${updatedCompany.name} (ID: ${id})`);
    
    res.status(200).json({ message: 'Associate Company updated successfully.', data: updatedCompany });
  } catch (error) {
    // --- Logging ---
    if (error.code === 11000) {
      logger.warn(`Attempted to update Associate Company to a duplicate name: '${name}'`);
      return res.status(409).json({ message: `An Associate Company with the name '${name}' already exists.` });
    }
    logger.error(`Failed to update Associate Company with ID ${id}: ${error.message}`);
    
    res.status(500).json({ error: 'Failed to update Associate Company.' });
  }
};

/**
 * @desc    Delete an Associate Company
 * @route   DELETE /api/associate-companies/:id
 * @access  Private
 */
exports.deleteAssociateCompany = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid ID.' });
  }

  try {
    const deletedCompany = await AssociateCompany.findByIdAndDelete(id);
    if (!deletedCompany) {
      // --- Logging ---
      logger.warn(`Attempted to delete non-existent Associate Company with ID: ${id}`);
      return res.status(404).json({ message: 'Associate Company not found.' });
    }
    
    // --- Logging ---
    logger.info(`Associate Company deleted: ${deletedCompany.name} (ID: ${id})`);
    
    res.status(200).json({ message: 'Associate Company deleted successfully.' });
  } catch (error) {
    // --- Logging ---
    logger.error(`Failed to delete Associate Company with ID ${id}: ${error.message}`);
    
    res.status(500).json({ error: 'Failed to delete Associate Company.' });
  }
};
