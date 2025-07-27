const mongoose = require('mongoose');

const factorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  party_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Party',
    required: true,
  },
}, {
  timestamps: true
});

module.exports = mongoose.models.Factory || mongoose.model('Factory', factorySchema);
