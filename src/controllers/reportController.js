const Order = require('../models/orderSchema');

/**
 * @desc    Generate a detailed order report based on complex filters.
 * @route   GET /api/reports/orders
 * @access  Private (should be protected by auth)
 */
exports.generateOrderReport = async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      party_id,
      factory_id,
      transactionType,
      source, // Expects format like "AssociateCompany:60d5f1b4e6a3c1..."
    } = req.query;

    const query = { disabled: false };

    // --- Build the filter query dynamically ---
    if (startDate && endDate) {
      query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }
    if (party_id) {
      query.party_id = party_id;
    }
    if (factory_id) {
      query.factory_id = factory_id;
    }
    if (transactionType) {
      query.transactionType = transactionType;
    }
    if (source) {
      const [sourceModel, sourceId] = source.split(':');
      if (sourceModel && sourceId) {
        query.sourceModel = sourceModel;
        query.source = sourceId;
      }
    }

    // --- Fetch ALL matching orders without pagination ---
    // Populate all necessary fields for a human-readable report
    const orders = await Order.find(query)
      .populate('party_id', 'name')
      .populate('factory_id', 'name')
      .populate('source', 'name username') // Gets name from AssociateCompany or username from ProductionHouse
      .sort({ date: -1 });

    res.status(200).json({
      message: `${orders.length} records found.`,
      data: orders,
    });

  } catch (error) {
    console.error('Error generating order report:', error);
    res.status(500).json({ message: 'Failed to generate report.' });
  }
};
