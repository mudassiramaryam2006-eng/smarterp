const mongoose = require('mongoose');
const { cleanJson } = require('./plugins');

const companySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    address: String,
    gstNumber: String,
    state: String,
    financialYear: { type: String, required: true }, // e.g. "2026-2027"
    contactPhone: String,
    contactEmail: String,
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  },
  { timestamps: true }
);
cleanJson(companySchema);

module.exports = mongoose.model('Company', companySchema);
