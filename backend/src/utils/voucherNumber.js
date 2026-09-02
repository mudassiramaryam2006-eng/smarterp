const Voucher = require('../models/Voucher');

// Generates the next sequential voucher number for a given company + voucher
// type, e.g. SALES -> "SV-0001", PURCHASE -> "PV-0001".
const PREFIXES = {
  SALES: 'SV',
  PURCHASE: 'PV',
  RECEIPT: 'RV',
  PAYMENT: 'PMV',
  CONTRA: 'CV',
  JOURNAL: 'JV',
  CREDIT_NOTE: 'CN',
  DEBIT_NOTE: 'DN',
};

async function nextVoucherNumber(companyId, type, session) {
  const prefix = PREFIXES[type] || 'VC';

  const last = await Voucher.findOne({ companyId, type })
    .sort({ createdAt: -1 })
    .session(session || null);

  let nextSeq = 1;
  if (last) {
    const match = last.voucherNo.match(/(\d+)$/);
    if (match) nextSeq = parseInt(match[1], 10) + 1;
  }

  return `${prefix}-${String(nextSeq).padStart(4, '0')}`;
}

module.exports = { nextVoucherNumber };
