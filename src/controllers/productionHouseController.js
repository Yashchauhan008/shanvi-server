const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const ProductionHouse = require('../models/productionHouseSchema'); // Corrected path to your schema file

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
    // All inventory fields (film_white, patti_role, etc.) will automatically be
    // set to their default value of 0 as defined in the schema.
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
      return res.status(401).json({ message: 'Invalid credentials.' }); // 401 for unauthorized
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
    const productionHouse = await ProductionHouse.findById(id).select('-password'); // Exclude password from result

    if (!productionHouse) {
      return res.status(404).json({ message: "Production House not found." });
    }

    res.status(200).json(productionHouse);

  } catch (error) {
    console.error('Get Production House Error:', error);
    // Handle cases like invalid ObjectId format
    if (error.kind === 'ObjectId') {
        return res.status(400).json({ message: 'Invalid Production House ID format.' });
    }
    res.status(500).json({ message: "Server error." });
  }
};
