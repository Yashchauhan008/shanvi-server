const Order = require('../models/orderSchema');
const ProductionHouse = require('../models/productionHouseSchema');
const Counter = require('../models/counterSchema'); // <-- Import the new Counter model
const mongoose = require('mongoose');

const inventoryFields = [
  'film_white', 'film_blue', 'patti_role', 'angle_board_24', 'angle_board_32',
  'angle_board_36', 'angle_board_39', 'angle_board_48', 'cap_hit', 'cap_simple',
  'firmshit', 'thermocol', 'mettle_angle', 'black_cover', 'packing_clip', 'patiya', 'plypatia'
];

// --- HELPER FUNCTION FOR CUSTOM IDs ---
async function getNextSequenceValue(sequenceName) {
  const sequenceDocument = await Counter.findByIdAndUpdate(
    sequenceName,
    { $inc: { sequence_value: 1 } },
    { new: true, upsert: true } // upsert: true creates the document if it doesn't exist
  );
  return sequenceDocument.sequence_value;
}



exports.addOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // --- ✅ THE FIX: Correctly build the newOrderData object ---
    // We now explicitly pull all required fields from the request body
    // to ensure they are included in the object passed to the Order model.
    const newOrderData = {
      date: req.body.date,
      source: req.body.source,
      sourceModel: req.body.sourceModel,
      transactionType: req.body.transactionType,
      party_id: req.body.party_id,
      factory_id: req.body.factory_id,
      vehicle: req.body.vehicle,
      vehicle_number: req.body.vehicle_number,
      items: (req.body.items || []).map(item => ({
        ...item,
        quantity: parseInt(item.quantity, 10) || 0,
      })),
    };

    // Add inventory fields, defaulting to 0 if not provided
    inventoryFields.forEach(field => {
      newOrderData[field] = parseInt(req.body[field], 10) || 0;
    });


    // --- Inventory Validation (Unchanged) ---
    if (newOrderData.transactionType === 'order' && newOrderData.sourceModel === 'ProductionHouse') {
      const productionHouse = await ProductionHouse.findById(newOrderData.source).session(session);
      if (!productionHouse) {
        throw new Error('Source Production House not found.');
      }
      for (const field of inventoryFields) {
        const requestedAmount = newOrderData[field];
        const availableAmount = productionHouse[field];
        if (requestedAmount > 0 && requestedAmount > availableAmount) {
          throw new Error(`Insufficient stock for ${field.replace(/_/g, ' ')}: ${requestedAmount} requested, but only ${availableAmount} available.`);
        }
      }
    }

    // --- Generate Custom Order/Bill ID (Unchanged) ---
    const prefix = newOrderData.transactionType === 'order' ? 'ORD' : 'BILL';
    const counterId = newOrderData.transactionType === 'order' ? 'orderId' : 'billId';
    
    const updatedCounter = await Counter.findByIdAndUpdate(
      counterId,
      { $inc: { sequence_value: 1 } },
      { new: true, session }
    );

    if (!updatedCounter) {
      throw new Error(`Counter document with ID '${counterId}' not found or failed to update.`);
    }
    newOrderData.customOrderId = `${prefix}-${String(updatedCounter.sequence_value).padStart(4, '0')}`;


    // --- Create the Order/Bill Document (Unchanged) ---
    const order = new Order(newOrderData);
    await order.save({ session });

    // --- Atomically Update Inventory (Unchanged) ---
    if (newOrderData.transactionType === 'order' && newOrderData.sourceModel === 'ProductionHouse') {
      const inventoryUpdate = {};
      inventoryFields.forEach(field => {
        if (newOrderData[field] > 0) {
          inventoryUpdate[field] = -newOrderData[field];
        }
      });
      if (Object.keys(inventoryUpdate).length > 0) {
        await ProductionHouse.findByIdAndUpdate(
          newOrderData.source,
          { $inc: inventoryUpdate },
          { session }
        );
      }
    }

    // --- Commit Transaction and Respond (Unchanged) ---
    await session.commitTransaction();
    res.status(201).json({
      message: `${newOrderData.transactionType.charAt(0).toUpperCase() + newOrderData.transactionType.slice(1)} created successfully!`,
      data: order,
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('Add Order/Bill Error:', error.message);
    res.status(400).json({ message: error.message });
  } finally {
    session.endSession();
  }
};

/**
 * @desc    Get a list of all orders with filtering and pagination.
 * @route   GET /api/orders
 * @access  Private
 */
exports.getOrders = async (req, res) => {
    try {
        // --- 1. Build the Query Object ---
        // Start with a base query to exclude soft-deleted items.
        const query = { disabled: false };

        // Dynamically add filters to the query if they exist in the request.
        if (req.query.transactionType) {
            query.transactionType = req.query.transactionType;
        }
        if (req.query.party_id) {
            query.party_id = req.query.party_id;
        }
        if (req.query.factory_id) {
            query.factory_id = req.query.factory_id;
        }
        if (req.query.startDate && req.query.endDate) {
            query.date = { 
                $gte: new Date(req.query.startDate), 
                $lte: new Date(req.query.endDate) 
            };
        }
        // This controller can also handle the polymorphic 'source' filter if needed.
        if (req.query.source) {
            const [sourceModel, sourceId] = req.query.source.split(':');
            if (sourceModel && sourceId) {
                query.sourceModel = sourceModel;
                query.source = sourceId;
            }
        }

        // --- 2. Handle Pagination ---
        // Parse page and limit from the query, with default values.
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 20; // Default limit is 20
        const skip = (page - 1) * limit;

        // --- 3. Execute the Database Query ---
        // Find the documents that match the query.
        const orders = await Order.find(query)
            // Populate linked documents to get their names.
            .populate('source', 'username productionHouseName name') // Polymorphic populate
            .populate('party_id', 'name')
            .populate('factory_id', 'name')
            // Sort by the main 'date' field in descending order (newest first).
            .sort({ date: -1 })
            .skip(skip)
            .limit(limit);

        // --- 4. Get the Total Count ---
        // Get the total number of documents that match the filter criteria for pagination info.
        const total = await Order.countDocuments(query);

        // --- 5. Send the Response ---
        // Respond with the fetched data and pagination details.
        res.status(200).json({
            message: 'Orders retrieved successfully.',
            data: orders,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Get Orders Error:', error);
        res.status(500).json({ message: 'Failed to retrieve orders.' });
    }
};


// ... (keep all other controller functions and require statements)

/**
 * @desc    Get aggregated pallet statistics based on filters
 * @route   GET /api/orders/stats/pallets
 * @access  Private
 */
exports.getPalletStats = async (req, res) => {
  try {
    const { party_id, factory_id, source, startDate, endDate } = req.query;
    const matchStage = { disabled: false };

    // --- 1. Build the initial match stage (same as before) ---
    if (party_id) matchStage.party_id = new mongoose.Types.ObjectId(party_id);
    if (factory_id) matchStage.factory_id = new mongoose.Types.ObjectId(factory_id);
    if (source) matchStage.source = new mongoose.Types.ObjectId(source);
    if (startDate && endDate) {
      matchStage.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    // --- ✅ 2. The Corrected Aggregation Pipeline ---
    const palletStats = await Order.aggregate([
      // Stage 1: Filter documents based on query parameters
      { $match: matchStage },
      
      // Stage 2: Deconstruct the 'items' array into separate documents
      { $unwind: '$items' },
      
      // Stage 3: Group by pallet size and calculate 'totalOut' and 'totalIn'
      {
        $group: {
          _id: '$items.paletSize', // Group by the pallet size
          
          // Calculate totalOut: sum quantity ONLY if transactionType is 'order'
          totalOut: {
            $sum: {
              $cond: [{ $eq: ['$transactionType', 'order'] }, '$items.quantity', 0]
            }
          },
          
          // Calculate totalIn: sum quantity ONLY if transactionType is 'bill'
          totalIn: {
            $sum: {
              $cond: [{ $eq: ['$transactionType', 'bill'] }, '$items.quantity', 0]
            }
          }
        }
      },
      
      // Stage 4: Calculate the netBalance and format the output
      {
        $project: {
          _id: 0, // Exclude the default _id field
          palletSize: '$_id', // Rename _id to palletSize for the frontend
          totalOut: '$totalOut',
          totalIn: '$totalIn',
          // Calculate the difference
          netBalance: { $subtract: ['$totalOut', '$totalIn'] }
        }
      },

      // Stage 5: Sort the results alphabetically by pallet size
      { $sort: { palletSize: 1 } }
    ]);

    res.status(200).json({
      message: 'Pallet statistics retrieved successfully.',
      data: palletStats,
    });

  } catch (error) {
    console.error('Get Pallet Stats Error:', error);
    res.status(500).json({ message: 'Failed to retrieve pallet statistics.' });
  }
};


/**
 * @desc    Get a single order by its ID with all details populated
 * @route   GET /api/orders/:id
 * @access  Private
 */
exports.getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the order by its MongoDB _id
    const order = await Order.findById(id)
      .populate('party_id', 'name') // Get the party's name
      .populate('factory_id', 'name') // Get the factory's name
      .populate('source', 'name username'); // Get the source's name (works for both ProductionHouse and AssociateCompany)

    // Check if the order was found
    if (!order) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    // Respond with the complete order data
    res.status(200).json(order);

  } catch (error) {
    console.error('Get Order By ID Error:', error);
    // Handle cases where the ID format is invalid
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Invalid Order ID format.' });
    }
    res.status(500).json({ message: 'Server error while retrieving the order.' });
  }
};



// Add this function to your existing orderController.js

/**
 * @desc    Soft delete an order and restore inventory if applicable
 * @route   DELETE /api/orders/:id
 * @access  Private
 */
exports.deleteOrder = async (req, res) => {
  const { id } = req.params;
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Find the order within the transaction
    const order = await Order.findById(id).session(session);
    if (!order) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'Order not found.' });
    }

    // If already disabled, do nothing
    if (order.disabled) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'This order has already been deleted.' });
    }

    // 2. Check if the order was from a ProductionHouse and affects inventory
    if (order.sourceModel === 'ProductionHouse' && order.transactionType === 'order') {
      const productionHouse = await ProductionHouse.findById(order.source).session(session);
      if (!productionHouse) {
        throw new Error('Source Production House not found for inventory restoration.');
      }

      // Create the update object to add inventory back
      const inventoryToRestore = {};
      inventoryFields.forEach(field => {
        if (order[field] > 0) {
          inventoryToRestore[field] = order[field];
        }
      });

      // Use $inc to add the values back to the production house's inventory
      if (Object.keys(inventoryToRestore).length > 0) {
        await ProductionHouse.updateOne(
          { _id: order.source },
          { $inc: inventoryToRestore },
          { session }
        );
      }
    }

    // 3. Mark the order as disabled (soft delete)
    order.disabled = true;
    await order.save({ session });

    // 4. Commit the transaction
    await session.commitTransaction();
    session.endSession();

    res.status(200).json({ message: 'Order deleted successfully and inventory restored.' });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Delete Order Error:', error);
    res.status(500).json({ message: 'Failed to delete order due to a server error.' });
  }
};
