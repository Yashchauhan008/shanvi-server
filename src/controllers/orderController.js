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

// --- UPDATED addOrder CONTROLLER ---
// exports.addOrder = async (req, res) => {
//   const session = await mongoose.startSession();
//   session.startTransaction();
//   try {
//     const orderData = req.body;
//     if (!orderData.source || !orderData.sourceModel || !orderData.transactionType) {
//       throw new Error('Source, source model, and transaction type are required.');
//     }

//     // --- GENERATE CUSTOM ID ---
//     let customId;
//     if (orderData.transactionType === 'order') {
//       const seq = await getNextSequenceValue('orderId');
//       customId = `ORD-${String(seq).padStart(5, '0')}`;
//     } else if (orderData.transactionType === 'bill') {
//       const seq = await getNextSequenceValue('billId');
//       customId = `BILL-${String(seq).padStart(5, '0')}`;
//     } else {
//       throw new Error('Invalid transaction type.');
//     }
//     orderData.customOrderId = customId; // Add to the data object

//     // --- Inventory Logic (Unchanged) ---
//     let inventoryToSubtract = {};
//     let productionHouseId = null;
//     if (orderData.sourceModel === 'ProductionHouse') {
//       productionHouseId = orderData.source;
//       const productionHouse = await ProductionHouse.findById(productionHouseId).session(session);
//       if (!productionHouse) throw new Error('Production House not found.');
//       for (const field of inventoryFields) {
//         if (orderData[field] && orderData[field] > 0) {
//           if (productionHouse[field] < orderData[field]) {
//             throw new Error(`Not enough stock for ${field}.`);
//           }
//           inventoryToSubtract[field] = -orderData[field];
//         }
//       }
//     }

//     const newOrder = new Order(orderData);
//     await newOrder.save({ session });

//     if (Object.keys(inventoryToSubtract).length > 0) {
//       await ProductionHouse.findByIdAndUpdate(
//         productionHouseId,
//         { $inc: inventoryToSubtract },
//         { session }
//       );
//     }

//     await session.commitTransaction();
//     res.status(201).json({ message: 'Transaction created successfully!', data: newOrder });
//   } catch (error) {
//     await session.abortTransaction();
//     console.error('Add Order Transaction Error:', error);
//     res.status(500).json({ message: error.message || 'Failed to create order. Transaction was rolled back.' });
//   } finally {
//     session.endSession();
//   }
// };


exports.addOrder = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const {
        source, sourceModel, transactionType, party_id, factory_id, date,
        vehicle, vehicle_number, items, ...inventoryItems
      } = req.body;
  
      // --- 1. Basic Validation ---
      if (!source || !sourceModel || !transactionType || !party_id || !factory_id || !date) {
        throw new Error('Missing required fields for the order.');
      }
  
      // --- 2. Generate Custom ID (Unchanged) ---
      let customId;
      if (transactionType === 'order') {
        const seq = await getNextSequenceValue('orderId');
        customId = `ORD-${String(seq).padStart(5, '0')}`;
      } else if (transactionType === 'bill') {
        const seq = await getNextSequenceValue('billId');
        customId = `BILL-${String(seq).padStart(5, '0')}`;
      } else {
        throw new Error('Invalid transaction type.');
      }
  
      // --- 3. THE FIX: Manually build the new Order object ---
      // This ensures all data types are correct before saving.
      const newOrderData = {
        customOrderId: customId,
        date: new Date(date), // Ensure 'date' is a Date object
        source,
        sourceModel,
        transactionType,
        party_id,
        factory_id,
        vehicle,
        vehicle_number,
        // Explicitly map and parse the items array
        items: (items || []).map(item => ({
          paletSize: item.paletSize,
          // Guarantee that quantity is a number
          quantity: Number(item.quantity || 0)
        })),
      };
  
      // Add inventory items, ensuring they are numbers
      const inventoryToSubtract = {};
      for (const field of inventoryFields) {
        if (inventoryItems[field] && Number(inventoryItems[field]) > 0) {
          const value = Number(inventoryItems[field]);
          newOrderData[field] = value; // Add to the order object
          inventoryToSubtract[field] = -value; // Prepare for subtraction
        }
      }
  
      // --- 4. Inventory Subtraction Logic (Now uses the clean data) ---
      if (sourceModel === 'ProductionHouse' && Object.keys(inventoryToSubtract).length > 0) {
        const productionHouse = await ProductionHouse.findById(source).session(session);
        if (!productionHouse) throw new Error('Production House not found.');
  
        for (const field in inventoryToSubtract) {
          if (productionHouse[field] < -inventoryToSubtract[field]) { // Compare with positive value
            throw new Error(`Not enough stock for ${field}.`);
          }
        }
        // Perform the update
        await ProductionHouse.findByIdAndUpdate(
          source,
          { $inc: inventoryToSubtract },
          { session }
        );
      }
  
      // --- 5. Save the new, clean order data ---
      const newOrder = new Order(newOrderData);
      await newOrder.save({ session });
  
      // --- 6. Commit and Respond (Unchanged) ---
      await session.commitTransaction();
      res.status(201).json({ message: 'Transaction created successfully!', data: newOrder });
  
    } catch (error) {
      await session.abortTransaction();
      console.error('Add Order Transaction Error:', error);
      res.status(500).json({ message: error.message || 'Failed to create order. Transaction was rolled back.' });
    } finally {
      session.endSession();
    }
  };

  
// // --- UPDATED getOrders CONTROLLER ---
// exports.getOrders = async (req, res) => {
//     try {
//         const query = { disabled: false };

//         // Add new filters for transactionType and source
//         if (req.query.transactionType) {
//             query.transactionType = req.query.transactionType;
//         }
//         if (req.query.source) {
//             const [sourceModel, sourceId] = req.query.source.split(':');
//             if (sourceModel && sourceId) {
//                 query.sourceModel = sourceModel;
//                 query.source = sourceId;
//             }
//         }
//         if (req.query.party_id) query.party_id = req.query.party_id;
//         if (req.query.factory_id) query.factory_id = req.query.factory_id;
//         if (req.query.startDate && req.query.endDate) {
//             query.date = { $gte: new Date(req.query.startDate), $lte: new Date(req.query.endDate) };
//         }

//         const page = parseInt(req.query.page, 10) || 1;
//         const limit = parseInt(req.query.limit, 10) || 20;
//         const skip = (page - 1) * limit;

//         const orders = await Order.find(query)
//             .populate('source', 'username productionHouseName name') // Populate the polymorphic field
//             .populate('party_id', 'name')
//             .populate('factory_id', 'name')
//             .sort({ date: -1 })
//             .skip(skip)
//             .limit(limit);

//         const total = await Order.countDocuments(query);

//         res.status(200).json({
//             message: 'Orders retrieved successfully.',
//             data: orders,
//             pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
//         });
//     } catch (error) {
//         console.error('Get Orders Error:', error);
//         res.status(500).json({ message: 'Failed to retrieve orders.' });
//     }
// };


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

// ... (your other controller functions like getPalletStats, etc.)
