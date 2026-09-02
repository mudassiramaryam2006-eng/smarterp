const express = require('express');
const mongoose = require('mongoose');
const { z } = require('zod');
const Ledger = require('../models/Ledger');
const { StockItem, InventoryTransaction } = require('../models/StockItem');
const Voucher = require('../models/Voucher');
const { requireAuth, requireCompanyAccess } = require('../middleware/auth');
const { nextVoucherNumber } = require('../utils/voucherNumber');
const { generateInvoicePdf } = require('../utils/pdf');

const router = express.Router();
router.use(requireAuth);

const lineItemSchema = z.object({
  stockItemId: z.string(),
  quantity: z.number().positive(),
  rate: z.number().nonnegative(),
  gstPercent: z.number().min(0).max(100).optional(),
});

const salesVoucherSchema = z.object({
  customerId: z.string(),
  date: z.string().optional(),
  narration: z.string().optional(),
  items: z.array(lineItemSchema).min(1),
});

const purchaseVoucherSchema = z.object({
  supplierId: z.string(),
  date: z.string().optional(),
  narration: z.string().optional(),
  items: z.array(lineItemSchema).min(1),
});

function computeTotals(items, stockItemsById) {
  let subTotal = 0;
  let gstTotal = 0;
  const computedItems = items.map((li) => {
    const gstPercent = li.gstPercent ?? Number(stockItemsById[li.stockItemId].gstPercent);
    const amount = li.quantity * li.rate;
    const gstAmount = (amount * gstPercent) / 100;
    subTotal += amount;
    gstTotal += gstAmount;
    return { ...li, gstPercent, amount, gstAmount };
  });
  return { computedItems, subTotal, gstTotal, grandTotal: subTotal + gstTotal };
}

// ---------- SALES VOUCHER (Customer Bill) ----------
// Effect: stock decreases, customer outstanding increases, invoice auto-generated.

router.post('/companies/:companyId/vouchers/sales', requireCompanyAccess, async (req, res) => {
  const parsed = salesVoucherSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { customerId, date, narration, items } = parsed.data;

  const customer = await Ledger.findOne({ _id: customerId, companyId: req.company.id, type: 'CUSTOMER' });
  if (!customer) return res.status(404).json({ error: 'Customer ledger not found' });

  const stockItems = await StockItem.find({
    _id: { $in: items.map((i) => i.stockItemId) },
    companyId: req.company.id,
  });
  const stockItemsById = Object.fromEntries(stockItems.map((s) => [s.id, s]));

  for (const li of items) {
    const stock = stockItemsById[li.stockItemId];
    if (!stock) return res.status(404).json({ error: `Stock item ${li.stockItemId} not found` });
    if (Number(stock.quantity) < li.quantity) {
      return res.status(400).json({
        error: `Insufficient stock for "${stock.name}". Available: ${stock.quantity}, requested: ${li.quantity}`,
      });
    }
  }

  const { computedItems, subTotal, gstTotal, grandTotal } = computeTotals(items, stockItemsById);

  const session = await mongoose.startSession();
  let voucher;
  try {
    await session.withTransaction(async () => {
      const voucherNo = await nextVoucherNumber(req.company.id, 'SALES', session);

      const created = await Voucher.create(
        [
          {
            voucherNo,
            type: 'SALES',
            date: date ? new Date(date) : new Date(),
            companyId: req.company.id,
            customerId: customer.id,
            narration,
            subTotal,
            gstTotal,
            grandTotal,
            items: computedItems.map((ci) => ({
              stockItemId: ci.stockItemId,
              quantity: ci.quantity,
              rate: ci.rate,
              gstPercent: ci.gstPercent,
              amount: ci.amount,
              gstAmount: ci.gstAmount,
            })),
          },
        ],
        { session }
      );
      voucher = created[0];

      for (const ci of computedItems) {
        await StockItem.updateOne(
          { _id: ci.stockItemId },
          { $inc: { quantity: -ci.quantity } },
          { session }
        );
        await InventoryTransaction.create(
          [{ stockItemId: ci.stockItemId, type: 'STOCK_OUT', quantity: ci.quantity, note: `Sales voucher ${voucherNo}` }],
          { session }
        );
      }

      await Ledger.updateOne({ _id: customer.id }, { $inc: { currentBalance: grandTotal } }, { session });
    });
  } finally {
    session.endSession();
  }

  const populated = await Voucher.findById(voucher._id).populate('customerId');
  res.status(201).json(populated);
});

// ---------- PURCHASE VOUCHER (Indirect Stock Entry) ----------
// Effect: stock increases, supplier outstanding increases.

router.post('/companies/:companyId/vouchers/purchase', requireCompanyAccess, async (req, res) => {
  const parsed = purchaseVoucherSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { supplierId, date, narration, items } = parsed.data;

  const supplier = await Ledger.findOne({ _id: supplierId, companyId: req.company.id, type: 'SUPPLIER' });
  if (!supplier) return res.status(404).json({ error: 'Supplier ledger not found' });

  const stockItems = await StockItem.find({
    _id: { $in: items.map((i) => i.stockItemId) },
    companyId: req.company.id,
  });
  const stockItemsById = Object.fromEntries(stockItems.map((s) => [s.id, s]));
  for (const li of items) {
    if (!stockItemsById[li.stockItemId]) {
      return res.status(404).json({ error: `Stock item ${li.stockItemId} not found` });
    }
  }

  const { computedItems, subTotal, gstTotal, grandTotal } = computeTotals(items, stockItemsById);

  const session = await mongoose.startSession();
  let voucher;
  try {
    await session.withTransaction(async () => {
      const voucherNo = await nextVoucherNumber(req.company.id, 'PURCHASE', session);

      const created = await Voucher.create(
        [
          {
            voucherNo,
            type: 'PURCHASE',
            date: date ? new Date(date) : new Date(),
            companyId: req.company.id,
            supplierId: supplier.id,
            narration,
            subTotal,
            gstTotal,
            grandTotal,
            items: computedItems.map((ci) => ({
              stockItemId: ci.stockItemId,
              quantity: ci.quantity,
              rate: ci.rate,
              gstPercent: ci.gstPercent,
              amount: ci.amount,
              gstAmount: ci.gstAmount,
            })),
          },
        ],
        { session }
      );
      voucher = created[0];

      for (const ci of computedItems) {
        await StockItem.updateOne(
          { _id: ci.stockItemId },
          { $inc: { quantity: ci.quantity } },
          { session }
        );
        await InventoryTransaction.create(
          [{ stockItemId: ci.stockItemId, type: 'STOCK_IN', quantity: ci.quantity, note: `Purchase voucher ${voucherNo}` }],
          { session }
        );
      }

      await Ledger.updateOne({ _id: supplier.id }, { $inc: { currentBalance: grandTotal } }, { session });
    });
  } finally {
    session.endSession();
  }

  const populated = await Voucher.findById(voucher._id).populate('supplierId');
  res.status(201).json(populated);
});

// ---------- List / fetch vouchers ----------

router.get('/companies/:companyId/vouchers', requireCompanyAccess, async (req, res) => {
  const { type } = req.query;
  const vouchers = await Voucher.find({ companyId: req.company.id, ...(type ? { type } : {}) })
    .populate('customerId')
    .populate('supplierId')
    .sort({ date: -1 });
  res.json(vouchers);
});

router.get('/companies/:companyId/vouchers/:id', requireCompanyAccess, async (req, res) => {
  const voucher = await Voucher.findOne({ _id: req.params.id, companyId: req.company.id })
    .populate('customerId')
    .populate('supplierId')
    .populate('items.stockItemId');
  if (!voucher) return res.status(404).json({ error: 'Voucher not found' });
  res.json(voucher);
});

// GET /companies/:companyId/vouchers/:id/pdf - download the invoice for a voucher
router.get('/companies/:companyId/vouchers/:id/pdf', requireCompanyAccess, async (req, res) => {
  const voucher = await Voucher.findOne({ _id: req.params.id, companyId: req.company.id })
    .populate('customerId')
    .populate('supplierId')
    .populate('items.stockItemId');
  if (!voucher) return res.status(404).json({ error: 'Voucher not found' });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${voucher.voucherNo}.pdf"`);
  generateInvoicePdf(voucher, req.company).pipe(res);
});

module.exports = router;
