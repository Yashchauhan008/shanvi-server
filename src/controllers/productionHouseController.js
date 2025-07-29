const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose'); // <-- ADDED THIS LINE
const ProductionHouse = require('../models/productionHouseSchema');

// /**
//  * @desc    Register a new Production House
//  * @route   POST /api/production-house/register
//  * @access  Public
//  */
exports.registerNewProductionHouse = async (req, res) => {
  const { productionHouseName, username, password, email } = req.body;

  try {
    // 1️⃣ Check if a production house with the same username or email already exists
    const existingUser = await ProductionHouse.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(400).json({ message: 'Username or email already exists.' });
    }

    // 2️⃣ Hash the password before saving
    const hashedPassword = await bcrypt.hash(password, 12);

    // 3️⃣ Create the new ProductionHouse instance.
    const productionHouse = new ProductionHouse({
      productionHouseName,
      username,
      email,
      password: hashedPassword,
    });

    // 4️⃣ Save the new production house to the database
    await productionHouse.save();

    // 5️⃣ Respond with success message and essential data
    res.status(201).json({
      message: 'Production House registered successfully!',
      productionHouse: {
        _id: productionHouse._id,
        username: productionHouse.username,
        email: productionHouse.email,
      }
    });

  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({ error: 'Server error during registration.' });
  }
};

/**
 * @desc    Authenticate a Production House and get a token
 * @route   POST /api/production-house/login
 * @access  Public
 */
exports.login = async (req, res) => {
  const { username, password } = req.body;

  try {
    // 1️⃣ Find the production house by username
    const productionHouse = await ProductionHouse.findOne({ username });
    if (!productionHouse) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    // 2️⃣ Compare the provided password with the stored hashed password
    const isMatch = await bcrypt.compare(password, productionHouse.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    // 3️⃣ Create a JWT Token
    const token = jwt.sign(
      { productionId: productionHouse._id, username: productionHouse.username },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );

    // 4️⃣ Send the token and user info in the response
    res.status(200).json({
      message: "Login successful!",
      token,
      productionHouse: {
        id: productionHouse._id,
        username: productionHouse.username,
        email: productionHouse.email,
      },
    });

  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ message: 'Server error during login.' });
  }
};

/**
 * @desc    Get a specific Production House by its ID
 * @route   GET /api/production-house/:id
 * @access  Private (should be protected)
 */
exports.getProductionHouseByID = async (req, res) => {
  try {
    const { id } = req.params;
    const productionHouse = await ProductionHouse.findById(id).select('-password');

    if (!productionHouse) {
      return res.status(404).json({ message: "Production House not found." });
    }

    res.status(200).json(productionHouse);

  } catch (error) {
    console.error('Get Production House Error:', error);
    if (error.kind === 'ObjectId') {
        return res.status(400).json({ message: 'Invalid Production House ID format.' });
    }
    res.status(500).json({ message: "Server error." });
  }
};


// --- ADDED THIS ARRAY DEFINITION ---
const inventoryFields = [
  'film_white', 'film_blue', 'patti_role', 'angle_board_24', 'angle_board_32',
  'angle_board_36', 'angle_board_39', 'angle_board_48', 'cap_hit', 'cap_simple',
  'firmshit', 'thermocol', 'mettle_angle', 'black_cover', 'packing_clip', 'patiya', 'plypatia'
];

/**
 * @desc    Get all inventory items for a specific Production House
 * @route   GET /api/production-house/:id/inventory
 * @access  Private (should be protected by auth)
 */
exports.getInventoryByProductionHouseId = async (req, res) => {
  const { id } = req.params;

  // This line will now work because mongoose is imported at the top of the file.
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid Production House ID format.' });
  }

  try {
    // This line will now work because the inventoryFields array is defined above.
    const inventoryData = await ProductionHouse.findById(id).select(inventoryFields.join(' '));

    if (!inventoryData) {
      return res.status(404).json({ message: 'Production House not found.' });
    }

    res.status(200).json({
      message: 'Inventory retrieved successfully.',
      data: inventoryData,
    });

  } catch (error) {
    console.error('Get Inventory Error:', error);
    res.status(500).json({ message: 'Server error while retrieving inventory.' });
  }
};


/**
 * @desc    Add quantities to a Production House's inventory
 * @route   POST /api/production-house/:id/inventory
 * @access  Private (should be protected by auth)
 */
exports.addInventory = async (req, res) => {
  const { id } = req.params;
  const incomingStock = req.body; // e.g., { "Film White": 100, "Patti Role": 50 }

  // 1. Validate the Production House ID
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid Production House ID format.' });
  }

  // 2. Check if there's any data to add
  if (!incomingStock || Object.keys(incomingStock).length === 0) {
    return res.status(400).json({ message: 'No inventory data provided to add.' });
  }

  // 3. Prepare the data for MongoDB's $inc operator
  // We need to convert the form's keys ("Film White") to the schema's keys ("film_white")
  const updateOperation = {};
  for (const key in incomingStock) {
    const value = incomingStock[key];
    if (typeof value === 'number' && value > 0) {
      // Convert "Film White" to "film_white"
      const schemaKey = key.toLowerCase().replace(/ /g, '_');
      updateOperation[schemaKey] = value;
    }
  }

  // 4. Check if there are any valid items to update after formatting
  if (Object.keys(updateOperation).length === 0) {
    return res.status(400).json({ message: 'No valid inventory items to update.' });
  }

  try {
    // 5. Find the Production House and atomically increment the inventory fields
    // The { new: true } option returns the document *after* the update has been applied.
    const updatedProductionHouse = await ProductionHouse.findByIdAndUpdate(
      id,
      { $inc: updateOperation }, // $inc is perfect for adding quantities
      { new: true }
    ).select(inventoryFields.join(' ')); // Return only the updated inventory

    if (!updatedProductionHouse) {
      return res.status(404).json({ message: 'Production House not found.' });
    }

    // 6. Respond with the new, updated inventory data
    res.status(200).json({
      message: 'Inventory updated successfully.',
      data: updatedProductionHouse,
    });

  } catch (error) {
    console.error('Add Inventory Error:', error);
    res.status(500).json({ message: 'Server error while updating inventory.' });
  }
};