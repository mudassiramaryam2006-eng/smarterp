require('dotenv').config();
require('express-async-errors');

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { connectDB } = require('./db');

const authRoutes = require('./routes/auth');
const companyRoutes = require('./routes/companies');
const ledgerRoutes = require('./routes/ledgers');
const voucherRoutes = require('./routes/vouchers');

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());
app.use(morgan('dev'));

app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'smarterp-backend' }));

app.use('/api/auth', authRoutes);
app.use('/api/companies', companyRoutes);
// ledgers & vouchers routes are mounted under /api because their internal
// paths already start with /companies/:companyId/...
app.use('/api', ledgerRoutes);
app.use('/api', voucherRoutes);

// 404
app.use((req, res) => res.status(404).json({ error: 'Not found' }));

// Central error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 4000;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`SmartERP backend running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB Atlas:', err.message);
    process.exit(1);
  });
