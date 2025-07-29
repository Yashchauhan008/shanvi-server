const mongoose = require('mongoose');

const palletSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Pallet name/size is required.'], // Make it required
    unique: true, // Ensure no duplicate pallet sizes can be created
    trim: true,   // Remove any leading/trailing whitespace
  },
}, {
  timestamps: true // Adds createdAt and updatedAt fields
});

module.exports = mongoose.models.Pallet || mongoose.model('Pallet', palletSchema);
