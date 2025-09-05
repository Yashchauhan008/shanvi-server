const Order = require('../models/orderSchema');
const ProductionHouse = require('../models/productionHouseSchema');
const Counter = require('../models/counterSchema'); // <-- Import the new Counter model
const mongoose = require('mongoose');

const parseCalculableString = (inputString) => {
  if (!inputString || typeof inputString !== 'string') return 0;
  // Splits the string by '+' and sums the parts, ensuring they are parsed as numbers.
  return inputString.split('+').reduce((sum, part) => {
    const num = parseFloat(part.trim()); // Use parseFloat to handle potential decimals
    return sum + (isNaN(num) ? 0 : num);
  }, 0);
};
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



// exports.addOrder = async (req, res) => {
//   const session = await mongoose.startSession();
//   session.startTransaction();

//   try {
//     const newOrderData = {
//       date: req.body.date,
//       source: req.body.source,
//       sourceModel: req.body.sourceModel,
//       transactionType: req.body.transactionType,
//       party_id: req.body.party_id,
//       factory_id: req.body.factory_id,
//       vehicle: req.body.vehicle,
//       vehicle_number: req.body.vehicle_number,
//       items: (req.body.items || []).map(item => ({
//         ...item,
//         quantity: parseInt(item.quantity, 10) || 0,
//       })),
//     };

//     // Populate all fields from request body
//     inventoryFields.forEach(field => {
//       // For CAP fields, we take the string directly. For others, parse as a number.
//       if (field.startsWith('cap_')) {
//         newOrderData[field] = req.body[field] || '0';
//       } else {
//         newOrderData[field] = parseInt(req.body[field], 10) || 0;
//       }
//     });

//     // ... (customOrderId generation is unchanged) ...
//     const prefix = newOrderData.transactionType === 'order' ? 'ORD' : 'BILL';
//     const counterId = newOrderData.transactionType === 'order' ? 'orderId' : 'billId';
//     const updatedCounter = await Counter.findByIdAndUpdate(counterId, { $inc: { sequence_value: 1 } }, { new: true, upsert: true, session });
//     if (!updatedCounter) throw new Error(`Counter document with ID '${counterId}' not found.`);
//     newOrderData.customOrderId = `${prefix}-${String(updatedCounter.sequence_value).padStart(4, '0')}`;

//     const order = new Order(newOrderData);
//     await order.save({ session });

//     // --- CORRECTED INVENTORY LOGIC ---
//     if (newOrderData.transactionType === 'order') {
//       const productionHouse = await ProductionHouse.findOne().session(session);
//       if (!productionHouse) {
//         throw new Error('Main Production House not found to update stock.');
//       }

//       const inventoryUpdate = {};
      
//       for (const field of inventoryFields) {
//         let requestedAmount = 0;

//         // ✅ If it's a CAP field, parse the string to get the total numeric value.
//         if (field.startsWith('cap_')) {
//           requestedAmount = parseCalculableString(newOrderData[field]);
//         } else {
//           requestedAmount = newOrderData[field];
//         }

//         if (requestedAmount > 0) {
//           if (requestedAmount > productionHouse[field]) {
//             throw new Error(`Insufficient stock for ${field.replace(/_/g, ' ')}.`);
//           }
//           inventoryUpdate[field] = -requestedAmount;
//         }
//       }

//       if (Object.keys(inventoryUpdate).length > 0) {
//         await ProductionHouse.updateOne(
//           { _id: productionHouse._id },
//           { $inc: inventoryUpdate },
//           { session }
//         );
//       }
//     }
//     // --- END OF CORRECTED LOGIC ---

//     await session.commitTransaction();
//     res.status(201).json({
//       message: `${newOrderData.transactionType.charAt(0).toUpperCase() + newOrderData.transactionType.slice(1)} created successfully!`,
//       data: order,
//     });

//   } catch (error) {
//     await session.abortTransaction();
//     console.error('Add Order/Bill Error:', error.message);
//     res.status(400).json({ message: error.message });
//   } finally {
//     session.endSession();
//   }
// };


exports.addOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
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

    // Populate all fields from request body
    inventoryFields.forEach(field => {
      if (field.startsWith('cap_')) {
        newOrderData[field] = req.body[field] || '0';
      } else {
        // Use parseFloat instead of parseInt
        newOrderData[field] = parseFloat(req.body[field]) || 0;
      }
    });


    const prefix = newOrderData.transactionType === 'order' ? 'ORD' : 'BILL';
    const counterId = newOrderData.transactionType === 'order' ? 'orderId' : 'billId';
    const updatedCounter = await Counter.findByIdAndUpdate(counterId, { $inc: { sequence_value: 1 } }, { new: true, upsert: true, session });
    if (!updatedCounter) throw new Error(`Counter document with ID '${counterId}' not found.`);
    newOrderData.customOrderId = `${prefix}-${String(updatedCounter.sequence_value).padStart(4, '0')}`;

    // Create the order with the raw string for CAP fields
    const order = new Order(newOrderData);
    await order.save({ session });

    // --- CORRECTED INVENTORY LOGIC ---
    if (newOrderData.transactionType === 'order') {
      const productionHouse = await ProductionHouse.findOne().session(session);
      if (!productionHouse) {
        throw new Error('Main Production House not found to update stock.');
      }

      const inventoryUpdate = {};
      
      for (const field of inventoryFields) {
        let requestedAmount = 0;

        // ✅ If it's a CAP field, parse the string to get the total numeric value for calculation.
        if (field.startsWith('cap_')) {
          requestedAmount = parseCalculableString(newOrderData[field]);
        } else {
          requestedAmount = newOrderData[field];
        }

        if (requestedAmount > 0) {
          if (requestedAmount > productionHouse[field]) {
            throw new Error(`Insufficient stock for ${field.replace(/_/g, ' ')}.`);
          }
          inventoryUpdate[field] = -requestedAmount;
        }
      }

      if (Object.keys(inventoryUpdate).length > 0) {
        await ProductionHouse.updateOne(
          { _id: productionHouse._id },
          { $inc: inventoryUpdate },
          { session }
        );
      }
    }
    // --- END OF CORRECTED LOGIC ---

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
      const query = { disabled: false };

      // ✅ --- THIS IS THE FIX for TransactionHistory ---
      // The logic to handle the 'source' parameter is now correctly included.
      if (req.query.transactionType) query.transactionType = req.query.transactionType;
      if (req.query.party_id) query.party_id = req.query.party_id;
      if (req.query.factory_id) query.factory_id = req.query.factory_id;
      if (req.query.startDate && req.query.endDate) {
          query.date = { 
              $gte: new Date(req.query.startDate), 
              $lte: new Date(req.query.endDate) 
          };
      }
      // This block correctly parses "ModelName:ID" and adds it to the query
      if (req.query.source) {
          const [sourceModel, sourceId] = req.query.source.split(':');
          if (sourceModel && sourceId && mongoose.Types.ObjectId.isValid(sourceId)) {
              query.sourceModel = sourceModel;
              query.source = new mongoose.Types.ObjectId(sourceId);
          }
      }
      // ✅ --- END OF FIX ---

      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 50;
      const skip = (page - 1) * limit;

      const orders = await Order.find(query)
          .populate('source', 'username productionHouseName name')
          .populate('party_id', 'name')
          .populate('factory_id', 'name')
          .sort({ date: -1, createdAt: -1 })
          .skip(skip)
          .limit(limit);

      const total = await Order.countDocuments(query);

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
// exports.getOrders = async (req, res) => {
//     try {
//         // --- 1. Build the Query Object ---
//         // Start with a base query to exclude soft-deleted items.
//         const query = { disabled: false };

//         // Dynamically add filters to the query if they exist in the request.
//         if (req.query.transactionType) {
//             query.transactionType = req.query.transactionType;
//         }
//         if (req.query.party_id) {
//             query.party_id = req.query.party_id;
//         }
//         if (req.query.factory_id) {
//             query.factory_id = req.query.factory_id;
//         }
//         if (req.query.startDate && req.query.endDate) {
//             query.date = { 
//                 $gte: new Date(req.query.startDate), 
//                 $lte: new Date(req.query.endDate) 
//             };
//         }
//         // This controller can also handle the polymorphic 'source' filter if needed.
//         if (req.query.source) {
//             const [sourceModel, sourceId] = req.query.source.split(':');
//             if (sourceModel && sourceId) {
//                 query.sourceModel = sourceModel;
//                 query.source = sourceId;
//             }
//         }

//         // --- 2. Handle Pagination ---
//         // Parse page and limit from the query, with default values.
//         const page = parseInt(req.query.page, 10) || 1;
//         const limit = parseInt(req.query.limit, 10) || 20; // Default limit is 20
//         const skip = (page - 1) * limit;

//         // --- 3. Execute the Database Query ---
//         // Find the documents that match the query.
//         const orders = await Order.find(query)
//             .populate('source', 'username productionHouseName name')
//             .populate('party_id', 'name')
//             .populate('factory_id', 'name')
//             .sort({ date: -1, createdAt: -1 }) // Primary sort by date, secondary by creation time
//             .skip(skip)
//             .limit(limit);
//         // --- 4. Get the Total Count ---
//         // Get the total number of documents that match the filter criteria for pagination info.
//         const total = await Order.countDocuments(query);

//         // --- 5. Send the Response ---
//         // Respond with the fetched data and pagination details.
//         res.status(200).json({
//             message: 'Orders retrieved successfully.',
//             data: orders,
//             pagination: {
//                 total,
//                 page,
//                 limit,
//                 totalPages: Math.ceil(total / limit)
//             }
//         });

//     } catch (error) {
//         console.error('Get Orders Error:', error);
//         res.status(500).json({ message: 'Failed to retrieve orders.' });
//     }
// };


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

    // ✅ --- THIS IS THE FIX for PalletTable ---
    // The logic to handle the 'source' parameter is now correctly included in the aggregation pipeline.
    if (party_id) matchStage.party_id = new mongoose.Types.ObjectId(party_id);
    if (factory_id) matchStage.factory_id = new mongoose.Types.ObjectId(factory_id);
    if (startDate && endDate) {
      matchStage.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }
    // This block correctly parses "ModelName:ID" and adds it to the match stage
    if (source) {
        const [sourceModel, sourceId] = source.split(':');
        if (sourceModel && sourceId && mongoose.Types.ObjectId.isValid(sourceId)) {
            matchStage.sourceModel = sourceModel;
            matchStage.source = new mongoose.Types.ObjectId(sourceId);
        }
    }
    // ✅ --- END OF FIX ---

    const palletStats = await Order.aggregate([
      { $match: matchStage },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.paletSize',
          totalOut: { $sum: { $cond: [{ $eq: ['$transactionType', 'order'] }, '$items.quantity', 0] } },
          totalIn: { $sum: { $cond: [{ $eq: ['$transactionType', 'bill'] }, '$items.quantity', 0] } }
        }
      },
      {
        $project: {
          _id: 0,
          palletSize: '$_id',
          totalOut: '$totalOut',
          totalIn: '$totalIn',
          netBalance: { $subtract: ['$totalOut', '$totalIn'] }
        }
      },
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
// exports.getPalletStats = async (req, res) => {
//   try {
//     const { party_id, factory_id, source, startDate, endDate } = req.query;
//     const matchStage = { disabled: false };

//     // --- 1. Build the initial match stage (same as before) ---
//     if (party_id) matchStage.party_id = new mongoose.Types.ObjectId(party_id);
//     if (factory_id) matchStage.factory_id = new mongoose.Types.ObjectId(factory_id);
//     if (source) matchStage.source = new mongoose.Types.ObjectId(source);
//     if (startDate && endDate) {
//       matchStage.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
//     }

//     // --- ✅ 2. The Corrected Aggregation Pipeline ---
//     const palletStats = await Order.aggregate([
//       // Stage 1: Filter documents based on query parameters
//       { $match: matchStage },
      
//       // Stage 2: Deconstruct the 'items' array into separate documents
//       { $unwind: '$items' },
      
//       // Stage 3: Group by pallet size and calculate 'totalOut' and 'totalIn'
//       {
//         $group: {
//           _id: '$items.paletSize', // Group by the pallet size
          
//           // Calculate totalOut: sum quantity ONLY if transactionType is 'order'
//           totalOut: {
//             $sum: {
//               $cond: [{ $eq: ['$transactionType', 'order'] }, '$items.quantity', 0]
//             }
//           },
          
//           // Calculate totalIn: sum quantity ONLY if transactionType is 'bill'
//           totalIn: {
//             $sum: {
//               $cond: [{ $eq: ['$transactionType', 'bill'] }, '$items.quantity', 0]
//             }
//           }
//         }
//       },
      
//       // Stage 4: Calculate the netBalance and format the output
//       {
//         $project: {
//           _id: 0, // Exclude the default _id field
//           palletSize: '$_id', // Rename _id to palletSize for the frontend
//           totalOut: '$totalOut',
//           totalIn: '$totalIn',
//           // Calculate the difference
//           netBalance: { $subtract: ['$totalOut', '$totalIn'] }
//         }
//       },

//       // Stage 5: Sort the results alphabetically by pallet size
//       { $sort: { palletSize: 1 } }
//     ]);

//     res.status(200).json({
//       message: 'Pallet statistics retrieved successfully.',
//       data: palletStats,
//     });

//   } catch (error) {
//     console.error('Get Pallet Stats Error:', error);
//     res.status(500).json({ message: 'Failed to retrieve pallet statistics.' });
//   }
// };


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
        let amountToRestore = 0;
        
        // If the field is a 'cap' field, parse its string value.
        if (field.startsWith('cap_')) {
          amountToRestore = parseCalculableString(order[field]);
        } else {
          // Otherwise, use its direct numeric value.
          amountToRestore = order[field] || 0;
        }

        // Only add to the update object if there's a value greater than 0.
        if (amountToRestore > 0) {
          inventoryToRestore[field] = amountToRestore;
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





/**
 * @desc    Find a single order by its customOrderId for the pop-up search
 * @route   GET /api/orders/search/:customId
 * @access  Private
 */
exports.findOrderByCustomId = async (req, res) => {
  try {
    const { customId } = req.params;

    // Use a case-insensitive regex to find the exact match.
    const order = await Order.findOne({ customOrderId: { $regex: `^${customId}$`, $options: 'i' } })
      .populate('party_id', 'name')
      .populate('factory_id', 'name')
      .populate('source', 'name username');

    if (!order) {
      return res.status(404).json({ message: `No record found with the ID '${customId}'.` });
    }

    res.status(200).json({
      message: 'Record found successfully.',
      data: order,
    });

  } catch (error) {
    console.error('Search Order by Custom ID Error:', error);
    res.status(500).json({ message: 'Server error during search.' });
  }
};


// ✅ --- THIS IS THE SIMPLIFIED AND CORRECTED CONTROLLER FUNCTION ---
/**
 * @desc    Update an existing order/bill (Party, Factory, Date, Vehicle, Pallet Items).
 * @route   PUT /api/orders/:id
 * @access  Private
 */
// exports.updateOrder = async (req, res) => {
//   const { id } = req.params;
//   const updatedData = req.body;

//   // The inventory adjustment logic has been completely removed.
//   // We are now only updating the fields provided in the request body.

//   try {
//     // Find the order and update it with the new data in a single, atomic operation.
//     // Mongoose will only update the fields that are present in the `updatedData` object.
//     const updatedOrder = await Order.findByIdAndUpdate(id, updatedData, { new: true, runValidators: true });

//     if (!updatedOrder) {
//       return res.status(404).json({ message: 'Order not found.' });
//     }

//     res.status(200).json({ message: 'Transaction updated successfully!', data: updatedOrder });

//   } catch (error) {
//     console.error('Update Order Error:', error);
//     res.status(400).json({ message: error.message || 'Failed to update transaction.' });
//   }
// };


// ✅ --- THIS IS THE CRITICAL FIX ---



/**
 * @desc    Update an existing order/bill, including complex inventory adjustments.
 * @route   PUT /api/orders/:id
 * @access  Private
 */
exports.updateOrder = async (req, res) => {
  const { id } = req.params;
  const updatedData = req.body;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Find the original order *before* any changes are made.
    const originalOrder = await Order.findById(id).session(session);
    if (!originalOrder) {
      throw new Error('Original transaction not found.');
    }

    // 2. Get the main Production House for inventory updates.
    const productionHouse = await ProductionHouse.findOne().session(session);
    if (!productionHouse) {
      throw new Error('Main Production House not found for inventory update.');
    }

    // 3. Calculate the *difference* in inventory for each item.
    const inventoryChanges = {};
    for (const field of inventoryFields) {
      let originalAmount = 0;
      let newAmount = 0;

      // Parse original and new amounts, handling CAP strings correctly.
      if (field.startsWith('cap_')) {
        originalAmount = parseCalculableString(originalOrder[field]);
        newAmount = parseCalculableString(updatedData[field]);
      } else {
        originalAmount = originalOrder[field] || 0;
        newAmount = updatedData[field] || 0;
      }

      // The change is the old amount minus the new amount.
      // Example: If old was 10 and new is 8, change is +2 (add 2 back to stock).
      // Example: If old was 10 and new is 15, change is -5 (remove 5 more from stock).
      const difference = originalAmount - newAmount;
      
      if (difference !== 0) {
        inventoryChanges[field] = difference;
      }
    }

    // 4. Validate if the new changes are possible with current stock.
    for (const field in inventoryChanges) {
      const change = inventoryChanges[field];
      // If we need to remove more stock (change is negative), check if we have enough.
      if (change < 0) {
        const currentStock = productionHouse[field];
        const additionalAmountNeeded = -change; // e.g., -5 becomes 5
        if (additionalAmountNeeded > currentStock) {
          throw new Error(`Insufficient stock for ${field.replace(/_/g, ' ')}. Needed: ${additionalAmountNeeded}, Available: ${currentStock}`);
        }
      }
    }

    // 5. Apply the calculated inventory changes to the Production House.
    if (Object.keys(inventoryChanges).length > 0) {
      await ProductionHouse.updateOne(
        { _id: productionHouse._id },
        { $inc: inventoryChanges }, // Use $inc to apply the positive/negative differences
        { session }
      );
    }

    // 6. Finally, update the order document itself with the new data.
    const updatedOrder = await Order.findByIdAndUpdate(id, updatedData, { new: true, runValidators: true, session });

    // 7. Commit the transaction.
    await session.commitTransaction();
    res.status(200).json({ message: 'Transaction updated successfully!', data: updatedOrder });

  } catch (error) {
    await session.abortTransaction();
    console.error('Update Order Error:', error);
    res.status(400).json({ message: error.message || 'Failed to update transaction.' });
  } finally {
    session.endSession();
  }
};