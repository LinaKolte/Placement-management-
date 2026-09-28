const mongoose = require("mongoose");

const adminAccountSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      default: "",
    },
    resetCodeHash: {
      type: String,
      default: "",
    },
    resetCodeExpiresAt: {
      type: Date,
      default: null,
    },
    resetCodeAttempts: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.AdminAccount || mongoose.model("AdminAccount", adminAccountSchema);
