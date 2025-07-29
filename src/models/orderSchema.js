const mongoose = require('mongoose');

const ItemSchema = new mongoose.Schema({
  paletSize: { type: String, required: true },
  quantity: { type: Number, required: true },
});

const OrderSchema = new mongoose.Schema({
  // --- NEW FIELD FOR HUMAN-READABLE ID ---
  customOrderId: {
    type: String,
    required: true,
    unique: true,
    index: true, // <-- It's good practice to define the simple index here.

  },
  date: { type: Date, required: true, default: Date.now },
  source: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'sourceModel' },
  sourceModel: { type: String, required: true, enum: ['ProductionHouse', 'AssociateCompany'] },
  transactionType: { type: String, required: true, enum: ['order', 'bill'] },
  factory_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Factory', required: true },
  party_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Party', required: true },
  items: [ItemSchema],
  vehicle: { type: String, required: true },
  vehicle_number: { type: String, required: true },
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
  disabled: { type: Boolean, default: false },
}, { timestamps: true });

// --- ADD INDEX FOR THE NEW FIELD ---
OrderSchema.index({ customOrderId: 1 });
OrderSchema.index({ source: 1, sourceModel: 1 });
OrderSchema.index({ transactionType: 1 });
OrderSchema.index({ date: -1 });
OrderSchema.index({ factory_id: 1, date: -1 });
OrderSchema.index({ party_id: 1, date: -1 });

module.exports = mongoose.models.Order || mongoose.model('Order', OrderSchema);
