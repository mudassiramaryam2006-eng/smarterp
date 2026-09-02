require('dotenv').config();
const bcrypt = require('bcryptjs');
const { connectDB } = require('../src/db');
const User = require('../src/models/User');
const Company = require('../src/models/Company');
const Ledger = require('../src/models/Ledger');
const { StockItem } = require('../src/models/StockItem');
const { Unit, StockGroup } = require('../src/models/masters');
// (paths are relative to backend/scripts/seed.js)

async function main() {
  await connectDB();

  const passwordHash = await bcrypt.hash('password123', 10);

  let user = await User.findOne({ email: 'admin@smarterp.dev' });
  if (!user) {
    user = await User.create({ name: 'Admin User', email: 'admin@smarterp.dev', passwordHash });
  }

  const company = await Company.create({
    name: 'Rahul Traders',
    address: '12 MG Road, Bengaluru',
    gstNumber: '29ABCDE1234F1Z5',
    state: 'Karnataka',
    financialYear: '2026-2027',
    contactPhone: '9876543210',
    contactEmail: 'contact@rahultraders.example',
    ownerId: user.id,
  });

  const unit = await Unit.create({ symbol: 'PCS', name: 'Pieces', companyId: company.id });
  const stockGroup = await StockGroup.create({ name: 'Electronics', companyId: company.id });

  await StockItem.create([
    {
      name: 'Laptop',
      sku: 'LAP-001',
      purchasePrice: 35000,
      sellingPrice: 42000,
      quantity: 15,
      gstPercent: 18,
      hsnCode: '84713010',
      unitId: unit.id,
      stockGroupId: stockGroup.id,
      companyId: company.id,
    },
    {
      name: 'Wireless Mouse',
      sku: 'MOU-001',
      purchasePrice: 300,
      sellingPrice: 550,
      quantity: 100,
      gstPercent: 18,
      unitId: unit.id,
      stockGroupId: stockGroup.id,
      companyId: company.id,
    },
  ]);

  await Ledger.create({
    name: 'ABC Store',
    type: 'CUSTOMER',
    mobile: '9000011111',
    address: 'Indiranagar, Bengaluru',
    companyId: company.id,
  });

  await Ledger.create({
    name: 'XYZ Wholesalers',
    type: 'SUPPLIER',
    mobile: '9000022222',
    address: 'Peenya Industrial Area, Bengaluru',
    companyId: company.id,
  });

  console.log('Seed complete. Login with admin@smarterp.dev / password123');
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
