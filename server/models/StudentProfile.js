const mongoose = require("mongoose");

const studentProfileSchema = new mongoose.Schema({
  rollNumber: {
    type: String,
    required: true,
    unique: true,
  },
  resume: String,
  marksheet: String,
  governmentId: String,
}, { timestamps: true });

module.exports = mongoose.model("StudentProfile", studentProfileSchema);