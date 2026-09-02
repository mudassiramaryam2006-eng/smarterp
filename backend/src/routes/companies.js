const express = require('express');
const { z } = require('zod');
const Company = require('../models/Company');
const { requireAuth, requireCompanyAccess } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

const MAX_COMPANIES_PER_USER = 5;

const companySchema = z.object({
  name: z.string().min(2),
  address: z.string().optional(),
  gstNumber: z.string().optional(),
  state: z.string().optional(),
  financialYear: z.string().min(4),
  contactPhone: z.string().optional(),
  contactEmail: z.string().email().optional().or(z.literal('')),
});

// GET /api/companies - list companies for the logged-in user
router.get('/', async (req, res) => {
  const companies = await Company.find({ ownerId: req.user.id }).sort({ createdAt: 1 });
  res.json(companies);
});

// POST /api/companies - create (max 5 per account)
router.post('/', async (req, res) => {
  const parsed = companySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const count = await Company.countDocuments({ ownerId: req.user.id });
  if (count >= MAX_COMPANIES_PER_USER) {
    return res.status(400).json({
      error: `You already have ${MAX_COMPANIES_PER_USER} companies. Delete one before creating another.`,
    });
  }

  const company = await Company.create({ ...parsed.data, ownerId: req.user.id });
  res.status(201).json(company);
});

// PUT /api/companies/:companyId - alter company
router.put('/:companyId', requireCompanyAccess, async (req, res) => {
  const parsed = companySchema.partial().safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  Object.assign(req.company, parsed.data);
  await req.company.save();
  res.json(req.company);
});

// DELETE /api/companies/:companyId
router.delete('/:companyId', requireCompanyAccess, async (req, res) => {
  await req.company.deleteOne();
  // Note: related ledgers/stock items/vouchers for this company are left in
  // place today (Mongo has no cascading FK deletes). Add a cleanup job here
  // if you want a hard delete of dependent collections.
  res.status(204).send();
});

module.exports = router;
