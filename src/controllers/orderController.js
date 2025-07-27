const Order = require('../models/orderSchema');
const ProductionHouse = require('../models/productionHouseSchema');
const mongoose = require('mongoose');

// An array of all inventory field names for easier iteration
const inventoryFields = [
  'film_white', 'film_blue', 'patti_role', 'angle_board_24', 'angle_board_32',
  'angle_board_36', 'angle_board_39', 'angle_board_48', 'cap_hit', 'cap_simple',
  'firmshit', 'thermocol', 'mettle_angle', 'black_cover', 'packing_clip', 'patiya', 'plypatia'
];

/**
 * @desc    Create a new order and deduct inventory
 * @route   POST /api/orders
 * @access  Private
 */
exports.createOrder = async (req, res) => {
    const orderData = req.body;

    // 1. Validate required fields
    if (!orderData.production_house_id || !orderData.party_id || !orderData.factory_id) {
        return res.status(400).json({ message: 'Production House, Party, and Factory IDs are required.' });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // 2. Find the Production House within the transaction
        const productionHouse = await ProductionHouse.findById(orderData.production_house_id).session(session);
        if (!productionHouse) {
            throw new Error('Production House not found.');
        }

        // 3. Check for sufficient inventory and prepare the update operation
        const inventoryUpdate = {};
        for (const field of inventoryFields) {
            const requestedAmount = orderData[field] || 0;
            if (productionHouse[field] < requestedAmount) {
                throw new Error(`Insufficient stock for ${field}. Available: ${productionHouse[field]}, Requested: ${requestedAmount}`);
            }
            if (requestedAmount > 0) {
                inventoryUpdate[field] = -requestedAmount; // Use negative value for $inc
            }
        }

        // 4. Create the new order document
        const newOrder = new Order(orderData);
        await newOrder.save({ session });

        // 5. Atomically deduct the inventory from the Production House
        await ProductionHouse.findByIdAndUpdate(
            orderData.production_house_id,
            { $inc: inventoryUpdate },
            { session }
        );

        // 6. Commit the transaction
        await session.commitTransaction();
        session.endSession();

        res.status(201).json({ message: 'Order created successfully and inventory updated.', data: newOrder });

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error('Create Order Error:', error);
        res.status(400).json({ message: error.message || 'Failed to create order.' });
    }
};

/**
 * @desc    Soft delete an order and restore inventory
 * @route   DELETE /api/orders/:id
 * @access  Private
 */
exports.deleteOrder = async (req, res) => {
    const { id } = req.params;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // 1. Find the order to be deleted
        const order = await Order.findById(id).session(session);
        if (!order || order.disabled) {
            throw new Error('Order not found or already deleted.');
        }

        // 2. Prepare inventory restoration values
        const inventoryUpdate = {};
        for (const field of inventoryFields) {
            const amountToRestore = order[field] || 0;
            if (amountToRestore > 0) {
                inventoryUpdate[field] = amountToRestore; // Positive value to add back
            }
        }

        // 3. Atomically restore the inventory
        await ProductionHouse.findByIdAndUpdate(
            order.production_house_id,
            { $inc: inventoryUpdate },
            { session }
        );

        // 4. Soft delete the order by setting disabled = true
        order.disabled = true;
        await order.save({ session });

        await session.commitTransaction();
        session.endSession();

        res.status(200).json({ message: 'Order successfully deleted and inventory restored.' });

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error('Delete Order Error:', error);
        res.status(400).json({ message: error.message || 'Failed to delete order.' });
    }
};

/**
 * @desc    Get orders with powerful filtering
 * @route   GET /api/orders
 * @access  Private
 */
exports.getOrders = async (req, res) => {
    try {
        // Base query to always exclude soft-deleted orders
        const query = { disabled: false };

        // Filtering by party, factory, and date range
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

        // Pagination
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 20;
        const skip = (page - 1) * limit;

        const orders = await Order.find(query)
            .populate('party_id', 'name')
            .populate('factory_id', 'name')
            .sort({ date: -1 }) // Use the indexed 'date' field for sorting
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

/**
 * @desc    Edit an order (Note: This is complex and does not adjust inventory)
 * @route   PUT /api/orders/:id
 * @access  Private
 */
exports.editOrder = async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;

    // IMPORTANT: This basic update does NOT handle inventory changes.
    // Changing item quantities would require a much more complex transaction:
    // 1. Find the original order.
    // 2. Calculate the difference between old and new quantities.
    // 3. Restore the old quantities to inventory.
    // 4. Check if there's enough stock for the new quantities.
    // 5. Deduct the new quantities from inventory.
    // 6. Save the updated order.
    // For now, we only allow updating non-inventory fields like vehicle info.

    const allowedUpdates = ['vehicle', 'vehicle_number', 'date'];
    const updates = {};
    for (const key of allowedUpdates) {
        if (updateData[key] !== undefined) {
            updates[key] = updateData[key];
        }
    }

    if (Object.keys(updates).length === 0) {
        return res.status(400).json({ message: 'No valid fields provided for update.' });
    }

    try {
        const updatedOrder = await Order.findByIdAndUpdate(id, updates, { new: true });
        if (!updatedOrder) {
            return res.status(404).json({ message: 'Order not found.' });
        }
        res.status(200).json({ message: 'Order updated successfully.', data: updatedOrder });
    } catch (error) {
        console.error('Edit Order Error:', error);
        res.status(500).json({ message: 'Failed to edit order.' });
    }
};
