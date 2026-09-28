const mongoose = require('mongoose');

const interviewShortlistSchema = new mongoose.Schema({
  applicationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Application',
    required: true,
    unique: true,
  },
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
  status: {
    type: String,
    enum: ['Shortlisted', 'Interview Scheduled', 'Selected', 'Rejected', 'Placed'],
    default: 'Shortlisted',
  },
  interviewSchedule: {
    date: { type: String, default: '' },
    time: { type: String, default: '' },
    round: { type: String, default: 'Round 1' },
    location: { type: String, default: '' },
    panel: { type: String, default: '' },
    notes: { type: String, default: '' },
  },
}, { timestamps: true });

interviewShortlistSchema.index({ companyId: 1, studentId: 1 });

module.exports = mongoose.model('InterviewShortlist', interviewShortlistSchema);
