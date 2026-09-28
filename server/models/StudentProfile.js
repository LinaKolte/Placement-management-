const mongoose = require("mongoose");

const studentProfileSchema = new mongoose.Schema({
  rollNumber: {
    type: String,
    required: true,
    unique: true,
  },
  name: String,
  email: String,
  phone: String,
  address: String,
  branch: String,
  skills: String,
  certifications: String,
  projects: String,
  linkedin: String,
  github: String,
  portfolio: String,
  profilePhoto: String,
  cgpa: {
    type: Number,
    default: null,
  },
  graduationYear: String,
  backlogs: {
    type: Number,
    default: null,
  },
  resume: String,
  marksheet: String,
  tenthMarksheet: String,
  twelfthMarksheet: String,
  semesterMarksheets: String,
  governmentId: String,
  tenthPercentage: {
    type: Number,
    default: null,
  },
  twelfthPercentage: {
    type: Number,
    default: null,
  },
  diplomaPercentage: {
    type: Number,
    default: null,
  },
  graduationMarks: {
    type: Number,
    default: null,
  },
  verificationStatus: {
    type: String,
    enum: ['Pending', 'Verified', 'Rejected'],
    default: null,
  },
  verificationNote: {
    type: String,
    default: '',
  },
}, { timestamps: true });

module.exports = mongoose.model("StudentProfile", studentProfileSchema);