const jwt = require('jsonwebtoken');
const Company = require('../models/Company');

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload; // { id, email, role, name }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// Ensures the authenticated user owns the company referenced by :companyId
// (or a companyId provided in the request body/query).
async function requireCompanyAccess(req, res, next) {
  const companyId = req.params.companyId || req.body.companyId || req.query.companyId;

  if (!companyId) {
    return res.status(400).json({ error: 'companyId is required' });
  }

  let company;
  try {
    company = await Company.findOne({ _id: companyId, ownerId: req.user.id });
  } catch {
    // Malformed ObjectId
    return res.status(404).json({ error: 'Company not found' });
  }

  if (!company) {
    return res.status(404).json({ error: 'Company not found' });
  }

  req.company = company;
  next();
}

module.exports = { requireAuth, requireCompanyAccess };
