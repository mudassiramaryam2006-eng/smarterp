const mongoose = require('mongoose');
const { cleanJson } = require('./plugins');

const stockItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    sku: { type: String, required: true },
    purchasePrice: { type: Number, default: 0 },
    sellingPrice: { type: Number, default: 0 },
    quantity: { type: Number, default: 0 }, // current stock
    reservedQty: { type: Number, default: 0 },
    damagedQty: { type: Number, default: 0 },
    gstPercent: { type: Number, default: 0 },
    hsnCode: String,
    unitId: { type: mongoose.Schema.Types.ObjectId, ref: 'Unit' },
    stockGroupId: { type: mongoose.Schema.Types.ObjectId, ref: 'StockGroup' },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  },
  { timestamps: true }
);
stockItemSchema.index({ companyId: 1, sku: 1 }, { unique: true });
cleanJson(stockItemSchema);

const inventoryTransactionSchema = new mongoose.Schema(
  {
    stockItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'StockItem', required: true, index: true },
    type: { type: String, enum: ['STOCK_IN', 'STOCK_OUT', 'TRANSFER', 'ADJUSTMENT'], required: true },
    quantity: { type: Number, required: true },
    note: String,
  },
  { timestamps: true }
);
cleanJson(inventoryTransactionSchema);

module.exports = {
  StockItem: mongoose.model('StockItem', stockItemSchema),
  InventoryTransaction: mongoose.model('InventoryTransaction', inventoryTransactionSchema),
};
