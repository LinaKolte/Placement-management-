const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  role: { type: String, required: true, trim: true },
  package: { type: String, default: '' },
  minCgpa: { type: Number, min: 0, max: 10, default: null },
  minTenthPercentage: { type: Number, min: 0, max: 100, default: null },
  minTwelfthPercentage: { type: Number, min: 0, max: 100, default: null },
  branches: { type: [String], default: [] },
  maxBacklogs: { type: Number, min: 0, default: null },
  noBacklogs: { type: Boolean, default: false },
  status: { type: String, enum: ['Open', 'Closing soon', 'Closed'], default: 'Open' },
  applicationStart: { type: Date, default: null },
  deadline: { type: Date, default: null },
}, { timestamps: true });

companySchema.index({ name: 1, role: 1 }, { unique: true });

module.exports = mongoose.model('Company', companySchema);