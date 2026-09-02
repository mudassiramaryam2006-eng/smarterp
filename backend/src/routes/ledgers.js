const express = require('express');
const { z } = require('zod');
const Ledger = require('../models/Ledger');
const { StockItem } = require('../models/StockItem');
const Voucher = require('../models/Voucher');
const { requireAuth, requireCompanyAccess } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

const ledgerSchema = z.object({
  name: z.string().min(2),
  type: z.enum(['CUSTOMER', 'SUPPLIER', 'EXPENSE', 'INCOME', 'BANK', 'CASH']),
  mobile: z.string().optional(),
  address: z.string().optional(),
  gstNumber: z.string().optional(),
  openingBalance: z.number().optional(),
  groupId: z.string().optional(),
});

const stockItemSchema = z.object({
  name: z.string().min(1),
  sku: z.string().min(1),
  purchasePrice: z.number().nonnegative(),
  sellingPrice: z.number().nonnegative(),
  quantity: z.number().nonnegative().optional(),
  gstPercent: z.number().min(0).max(100).optional(),
  hsnCode: z.string().optional(),
  unitId: z.string().optional(),
  stockGroupId: z.string().optional(),
});

// ---------- Ledgers (Customer / Supplier / Expense / Income / Bank / Cash) ----------

// GET /api/companies/:companyId/ledgers?type=CUSTOMER&search=abc
router.get('/companies/:companyId/ledgers', requireCompanyAccess, async (req, res) => {
  const { type, search } = req.query;
  const filter = {
    companyId: req.company.id,
    ...(type ? { type } : {}),
    ...(search ? { name: { $regex: String(search), $options: 'i' } } : {}),
  };
  const ledgers = await Ledger.find(filter).sort({ name: 1 });
  res.json(ledgers);
});

// GET single ledger
router.get('/companies/:companyId/ledgers/:id', requireCompanyAccess, async (req, res) => {
  const ledger = await Ledger.findOne({ _id: req.params.id, companyId: req.company.id });
  if (!ledger) return res.status(404).json({ error: 'Ledger not found' });
  res.json(ledger);
});

// POST create ledger
router.post('/companies/:companyId/ledgers', requireCompanyAccess, async (req, res) => {
  const parsed = ledgerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const data = parsed.data;
  const ledger = await Ledger.create({
    ...data,
    companyId: req.company.id,
    currentBalance: data.openingBalance ?? 0,
  });
  res.status(201).json(ledger);
});

// PUT alter ledger
router.put('/companies/:companyId/ledgers/:id', requireCompanyAccess, async (req, res) => {
  const parsed = ledgerSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const ledger = await Ledger.findOne({ _id: req.params.id, companyId: req.company.id });
  if (!ledger) return res.status(404).json({ error: 'Ledger not found' });

  Object.assign(ledger, parsed.data);
  await ledger.save();
  res.json(ledger);
});

// DELETE ledger
router.delete('/companies/:companyId/ledgers/:id', requireCompanyAccess, async (req, res) => {
  const ledger = await Ledger.findOne({ _id: req.params.id, companyId: req.company.id });
  if (!ledger) return res.status(404).json({ error: 'Ledger not found' });

  await ledger.deleteOne();
  res.status(204).send();
});

// GET customer/supplier statement (vouchers touching this ledger)
router.get('/companies/:companyId/ledgers/:id/statement', requireCompanyAccess, async (req, res) => {
  const ledger = await Ledger.findOne({ _id: req.params.id, companyId: req.company.id });
  if (!ledger) return res.status(404).json({ error: 'Ledger not found' });

  const vouchers = await Voucher.find({
    companyId: req.company.id,
    $or: [{ customerId: ledger.id }, { supplierId: ledger.id }],
  }).sort({ date: 1 });

  res.json({ ledger, vouchers });
});

// ---------- Stock Item ledger ----------

// GET /api/companies/:companyId/stock-items
router.get('/companies/:companyId/stock-items', requireCompanyAccess, async (req, res) => {
  const { search } = req.query;
  const filter = {
    companyId: req.company.id,
    ...(search
      ? { $or: [{ name: { $regex: String(search), $options: 'i' } }, { sku: { $regex: String(search), $options: 'i' } }] }
      : {}),
  };
  const items = await StockItem.find(filter).populate('unitId').populate('stockGroupId').sort({ name: 1 });
  res.json(items);
});

// POST create stock item
router.post('/companies/:companyId/stock-items', requireCompanyAccess, async (req, res) => {
  const parsed = stockItemSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  try {
    const item = await StockItem.create({ ...parsed.data, companyId: req.company.id });
    res.status(201).json(item);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'A stock item with this SKU already exists' });
    }
    throw err;
  }
});

// PUT alter stock item
router.put('/companies/:companyId/stock-items/:id', requireCompanyAccess, async (req, res) => {
  const parsed = stockItemSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const item = await StockItem.findOne({ _id: req.params.id, companyId: req.company.id });
  if (!item) return res.status(404).json({ error: 'Stock item not found' });

  Object.assign(item, parsed.data);
  await item.save();
  res.json(item);
});

// DELETE stock item
router.delete('/companies/:companyId/stock-items/:id', requireCompanyAccess, async (req, res) => {
  const item = await StockItem.findOne({ _id: req.params.id, companyId: req.company.id });
  if (!item) return res.status(404).json({ error: 'Stock item not found' });

  await item.deleteOne();
  res.status(204).send();
});

module.exports = router;
