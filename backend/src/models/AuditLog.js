const mongoose = require('mongoose');
const { cleanJson } = require('./plugins');

const auditLogSchema = new mongoose.Schema(
  {
    action: { type: String, required: true },
    entity: { type: String, required: true },
    entityId: String,
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', index: true },
  },
  { timestamps: true }
);
cleanJson(auditLogSchema);

module.exports = mongoose.model('AuditLog', auditLogSchema);
