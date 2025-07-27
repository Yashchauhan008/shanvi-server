const mongoose = require('mongoose');

const ItemSchema = new mongoose.Schema({
  paletSize: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
});

const OrderSchema = new mongoose.Schema({
  date: { // The custom date field for business logic
    type: Date,
    required: true,
    default: Date.now,
  },
  production_house_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProductionHouse',
    required: true,
  },
  factory_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Factory',
    required: true,
  },
  party_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Party',
    required: true,
  },
  items: [ItemSchema],
  vehicle: {
    type: String,
    required: true,
  },
  vehicle_number: {
    type: String,
    required: true,
  },
  // Inventory items for this specific order
  film_white: { type: Number, required: true, default: 0 },
  film_blue: { type: Number, required: true, default: 0 },
  patti_role: { type: Number, required: true, default: 0 },
  angle_board_24: { type: Number, required: true, default: 0 },
  angle_board_32: { type: Number, required: true, default: 0 },
  angle_board_36: { type: Number, required: true, default: 0 },
  angle_board_39: { type: Number, required: true, default: 0 },
  angle_board_48: { type: Number, required: true, default: 0 },
  cap_hit: { type: Number, required: true, default: 0 },
  cap_simple: { type: Number, required: true, default: 0 },
  firmshit: { type: Number, required: true, default: 0 },
  thermocol: { type: Number, required: true, default: 0 },
  mettle_angle: { type: Number, required: true, default: 0 },
  black_cover: { type: Number, required: true, default: 0 },
  packing_clip: { type: Number, required: true, default: 0 },
  patiya: { type: Number, required: true, default: 0 },
  plypatia: { type: Number, required: true, default: 0 },

  // ✅ Soft delete field
  disabled: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true // createdAt and updatedAt timestamps
});

// ✅ Index definitions for faster queries
OrderSchema.index({ date: -1 }); // -1 for descending, most recent first
OrderSchema.index({ factory_id: 1, date: -1 });
OrderSchema.index({ party_id: 1, date: -1 });
OrderSchema.index({ disabled: 1 });

module.exports = mongoose.models.Order || mongoose.model('Order', OrderSchema);
