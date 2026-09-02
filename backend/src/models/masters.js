const mongoose = require('mongoose');
const { cleanJson } = require('./plugins');

const accountGroupSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    type: { type: String, enum: ['ASSETS', 'LIABILITIES', 'INCOME', 'EXPENSES'], required: true },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  },
  { timestamps: true }
);
cleanJson(accountGroupSchema);

const unitSchema = new mongoose.Schema(
  {
    symbol: { type: String, required: true }, // PCS, KG, BOX, LTR
    name: { type: String, required: true },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  },
  { timestamps: true }
);
unitSchema.index({ companyId: 1, symbol: 1 }, { unique: true });
cleanJson(unitSchema);

const stockGroupSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  },
  { timestamps: true }
);
cleanJson(stockGroupSchema);

module.exports = {
  AccountGroup: mongoose.model('AccountGroup', accountGroupSchema),
  Unit: mongoose.model('Unit', unitSchema),
  StockGroup: mongoose.model('StockGroup', stockGroupSchema),
};
