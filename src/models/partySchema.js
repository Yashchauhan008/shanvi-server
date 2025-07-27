const mongoose = require('mongoose');

const partySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  factory_ids: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Factory',
  }],
}, {
  timestamps: true
});

module.exports = mongoose.models.Party || mongoose.model('Party', partySchema);
