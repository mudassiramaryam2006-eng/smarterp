const mongoose = require('mongoose');
const { cleanJson } = require('./plugins');

const voucherItemSchema = new mongoose.Schema(
  {
    stockItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'StockItem', required: true },
    quantity: { type: Number, required: true },
    rate: { type: Number, required: true },
    gstPercent: { type: Number, default: 0 },
    amount: { type: Number, required: true }, // qty * rate
    gstAmount: { type: Number, default: 0 },
  },
  { _id: false }
);

const voucherSchema = new mongoose.Schema(
  {
    voucherNo: { type: String, required: true },
    type: {
      type: String,
      enum: ['SALES', 'PURCHASE', 'RECEIPT', 'PAYMENT', 'CONTRA', 'JOURNAL', 'CREDIT_NOTE', 'DEBIT_NOTE'],
      required: true,
      index: true,
    },
    date: { type: Date, default: Date.now },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ledger' },
    supplierId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ledger' },
    items: [voucherItemSchema],
    subTotal: { type: Number, default: 0 },
    gstTotal: { type: Number, default: 0 },
    grandTotal: { type: Number, default: 0 },
    narration: String,
  },
  { timestamps: true }
);
voucherSchema.index({ companyId: 1, type: 1, voucherNo: 1 }, { unique: true });
cleanJson(voucherSchema);
// Give embedded items a clean `id` too
voucherSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    if (Array.isArray(ret.items)) {
      ret.items = ret.items.map((it) => ({ ...it, stockItemId: it.stockItemId?.toString?.() ?? it.stockItemId }));
    }
    return ret;
  },
});

module.exports = mongoose.model('Voucher', voucherSchema);
