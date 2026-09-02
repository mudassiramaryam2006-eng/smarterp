const mongoose = require('mongoose');
const { cleanJson } = require('./plugins');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['ADMIN', 'ACCOUNTANT', 'OPERATOR'], default: 'ADMIN' },
  },
  { timestamps: true }
);
cleanJson(userSchema);

module.exports = mongoose.model('User', userSchema);
