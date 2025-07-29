const AssociateCompany = require('../models/associateCompanySchema');
const mongoose = require('mongoose');

// Create a new Associate Company
exports.createAssociateCompany = async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ message: 'Company name is required.' });

  try {
    const newCompany = new AssociateCompany({ name });
    await newCompany.save();
    res.status(201).json({ message: 'Associate Company created successfully.', data: newCompany });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: `An Associate Company with the name '${name}' already exists.` });
    }
    res.status(500).json({ error: 'Failed to create Associate Company.' });
  }
};

// Get all Associate Companies
exports.getAllAssociateCompanies = async (req, res) => {
  try {
    const companies = await AssociateCompany.find().sort({ name: 1 });
    res.status(200).json(companies);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch Associate Companies.' });
  }
};

// Update an Associate Company
exports.updateAssociateCompany = async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid ID.' });
  if (!name) return res.status(400).json({ message: 'Company name is required.' });

  try {
    const updatedCompany = await AssociateCompany.findByIdAndUpdate(id, { name }, { new: true, runValidators: true });
    if (!updatedCompany) return res.status(404).json({ message: 'Associate Company not found.' });
    res.status(200).json({ message: 'Associate Company updated successfully.', data: updatedCompany });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: `An Associate Company with the name '${name}' already exists.` });
    }
    res.status(500).json({ error: 'Failed to update Associate Company.' });
  }
};

// Delete an Associate Company
exports.deleteAssociateCompany = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid ID.' });

  try {
    const deletedCompany = await AssociateCompany.findByIdAndDelete(id);
    if (!deletedCompany) return res.status(404).json({ message: 'Associate Company not found.' });
    res.status(200).json({ message: 'Associate Company deleted successfully.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete Associate Company.' });
  }
};
