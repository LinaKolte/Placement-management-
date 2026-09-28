const mongoose = require("mongoose");

const profileVerificationSchema = new mongoose.Schema({
  rollNumber: {
    type: String,
    required: true,
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
  cgpa: Number,
  tenthPercentage: Number,
  twelfthPercentage: Number,
  diplomaPercentage: Number,
  graduationMarks: Number,
  graduationYear: String,
  backlogs: Number,
  documents: {
    resume: {
      fileName: String,
      filePath: String,
      url: String,
      uploadedOn: String,
    },
    marksheet: {
      fileName: String,
      filePath: String,
      url: String,
      uploadedOn: String,
    },
    tenthMarksheet: {
      fileName: String,
      filePath: String,
      url: String,
      uploadedOn: String,
    },
    twelfthMarksheet: {
      fileName: String,
      filePath: String,
      url: String,
      uploadedOn: String,
    },
    semesterMarksheets: {
      fileName: String,
      filePath: String,
      url: String,
      uploadedOn: String,
    },
    idProof: {
      fileName: String,
      filePath: String,
      url: String,
      uploadedOn: String,
    },
  },
  verificationStatus: {
    type: String,
    enum: ['Pending', 'Verified', 'Rejected'],
    default: 'Pending',
  },
  verificationNote: String,
  verifiedBy: String,
  verificationDate: Date,
  submittedAt: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

module.exports = mongoose.model("ProfileVerification", profileVerificationSchema);
