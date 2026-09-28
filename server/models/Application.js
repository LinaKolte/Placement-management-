const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema(
  {
    studentId: {
      type: String,
      required: true,
    },

    companyId: {
      type: String,
      required: true,
    },

    companyName: {
      type: String,
      required: true,
    },

    deadline: {
      type: Date,
      default: null,
    },

    notificationSent: {
      type: Boolean,
      default: false,
    },

    notificationSentAt: {
      type: Date,
      default: null,
    },

    package: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      enum: ["Applied", "Shortlisted", "Interview Scheduled", "Selected", "Placed", "Rejected"],
      default: "Applied",
    },

    interviewSchedule: {
      date: { type: String, default: "" },
      time: { type: String, default: "" },
      round: { type: String, default: "Round 1" },
      location: { type: String, default: "" },
      panel: { type: String, default: "" },
      notes: { type: String, default: "" },
      scheduledAt: { type: Date, default: null },
    },

    rounds: [
      {
        roundName: { type: String, default: "Aptitude Round" },
        roundNumber: { type: Number, default: 1 },
        date: { type: String, default: "" },
        time: { type: String, default: "" },
        location: { type: String, default: "" },
        score: { type: String, default: "" },
        feedback: { type: String, default: "" },
        status: { type: String, enum: ["Qualified", "Rejected", "Pending"], default: "Pending" },
        createdAt: { type: Date, default: Date.now },
      },
    ],

    verificationStatus: {
      type: String,
      enum: ["Pending", "Verified", "Rejected"],
      default: "Pending",
    },

    verificationNote: {
      type: String,
      default: "",
    },

    verifiedBy: {
      type: String,
      default: "",
    },

    verificationUpdatedAt: {
      type: Date,
      default: null,
    },

    documents: [
      {
        documentType: String,
        fileName: String,
        filePath: String,
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Application", applicationSchema);