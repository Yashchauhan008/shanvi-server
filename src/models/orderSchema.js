

// const mongoose = require('mongoose');

// const ItemSchema = new mongoose.Schema({
//   paletSize: { type: String, required: true },
//   quantity: { type: Number, required: true },
// });

// const OrderSchema = new mongoose.Schema({
//   customOrderId: { type: String, required: true, unique: true, index: true },
//   date: { type: Date, required: true, default: Date.now },
//   source: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'sourceModel' },
//   sourceModel: { type: String, required: true, enum: ['ProductionHouse', 'AssociateCompany'] },
//   transactionType: { type: String, required: true, enum: ['order', 'bill'] },
//   party_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Party', required: true },
//   factory_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Factory', required: true },
//   items: [ItemSchema],
//   vehicle: { type: String },
//   vehicle_number: { type: String },
//   disabled: { type: Boolean, default: false },

//   film_white: { type: Number, default: 0 },
//   film_blue: { type: Number, default: 0 },
//   patti_roll: { type: Number, default: 0 },
//   packing_clip: { type: Number, default: 0 },
//   angle_board_24: { type: Number, default: 0 },
//   angle_board_32: { type: Number, default: 0 },
//   angle_board_36: { type: Number, default: 0 },
//   angle_board_39: { type: Number, default: 0 },
//   angle_board_48: { type: Number, default:
//  0 },
//   firmshit: { type: Number, default: 0 },
//   thermocol: { type: Number, default: 0 },
//   mettle_angle: { type: Number, default: 0 },
//   black_cover: { type: Number, default: 0 },
//   patiya: { type: Number, default: 0 },
//   plypatia: { type: Number, default: 0 },

//   // The CAP fields are strings, so they don't need `required: true` either.
//   cap_hit: { type: String, default: '0' },
//   cap_simple: { type: String, default: '0' },
//   // ✅ --- END OF FIX ---

// }, { timestamps: true });

// // Indexes remain the same
// OrderSchema.index({ date: -1, createdAt: -1 });
// OrderSchema.index({ source: 1, sourceModel: 1 });
// OrderSchema.index({ transactionType: 1 });
// OrderSchema.index({ factory_id: 1, date: -1 });
// OrderSchema.index({ party_id: 1, date: -1 });

// module.exports = mongoose.models.Order || mongoose.model('Order', OrderSchema);


// src/models/orderSchema.js

const mongoose = require('mongoose');

const ItemSchema = new mongoose.Schema({
  paletSize: { type: String, required: true },
  quantity: { type: Number, required: true },
});

const OrderSchema = new mongoose.Schema({
  customOrderId: { type: String, required: true, unique: true, index: true },
  date: { type: Date, required: true, default: Date.now },
  source: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'sourceModel' },
  sourceModel: { type: String, required: true, enum: ['ProductionHouse', 'AssociateCompany'] },
  transactionType: { type: String, required: true, enum: ['order', 'bill'] },
  party_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Party', required: true },
  factory_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Factory', required: true },
  items: [ItemSchema],
  vehicle: { type: String },
  vehicle_number: { type: String },
  disabled: { type: Boolean, default: false },

  // ✅ All standard inventory items are Number to support floats.
  film_white: { type: Number, default: 0 },
  film_blue: { type: Number, default: 0 },
  patti_roll: { type: Number, default: 0 },
  packing_clip: { type: Number, default: 0 },
  angle_board_24: { type: Number, default: 0 },
  angle_board_32: { type: Number, default: 0 },
  angle_board_36: { type: Number, default: 0 },
  angle_board_39: { type: Number, default: 0 },
  angle_board_48: { type: Number, default: 0 },
  firmshit: { type: Number, default: 0 },
  thermocol: { type: Number, default: 0 },
  mettle_angle: { type: Number, default: 0 },
  black_cover: { type: Number, default: 0 },
  patiya: { type: Number, default: 0 },
  plypatia: { type: Number, default: 0 },

  // ✅ ONLY the CAP fields are String to store the "50+20" syntax.
  cap_hit: { type: String, default: '0' },
  cap_simple: { type: String, default: '0' },

}, { timestamps: true });

// Indexes
OrderSchema.index({ date: -1, createdAt: -1 });
OrderSchema.index({ source: 1, sourceModel: 1 });
OrderSchema.index({ transactionType: 1 });
OrderSchema.index({ factory_id: 1, date: -1 });
OrderSchema.index({ party_id: 1, date: -1 });

module.exports = mongoose.models.Order || mongoose.model('Order', OrderSchema);
