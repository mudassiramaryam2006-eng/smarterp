const mongoose = require('mongoose');
const { cleanJson } = require('./plugins');

const ledgerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    type: {
      type: String,
      enum: ['CUSTOMER', 'SUPPLIER', 'EXPENSE', 'INCOME', 'BANK', 'CASH'],
      required: true,
      index: true,
    },
    mobile: String,
    address: String,
    gstNumber: String,
    openingBalance: { type: Number, default: 0 },
    currentBalance: { type: Number, default: 0 },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'AccountGroup' },
  },
  { timestamps: true }
);
cleanJson(ledgerSchema);

module.exports = mongoose.model('Ledger', ledgerSchema);
