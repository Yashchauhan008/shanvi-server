const mongoose = require('mongoose');

const associateCompanySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Company name is required.'],
    unique: true,
    trim: true,
  },
}, {
  timestamps: true
});

module.exports = mongoose.models.AssociateCompany || mongoose.model('AssociateCompany', associateCompanySchema);
