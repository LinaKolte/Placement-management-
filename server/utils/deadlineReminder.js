const nodemailer = require('nodemailer');
const Application = require('../models/Application');
const StudentProfile = require('../models/StudentProfile');
const Notification = require('../models/Notification');

const REMINDER_LEAD_TIME_MINUTES = 60;

function createMailer() {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return null;
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

async function sendDeadlineReminder(application) {
  const profile = await StudentProfile.findOne({ rollNumber: application.studentId }).lean();
  const studentName = profile?.name || profile?.fullName || `Student ${application.studentId}`;
  const email = profile?.email || '';
  const closingDate = new Date(application.deadline);
  const closingTime = closingDate.toLocaleString();
  const minutesRemaining = Math.max(1, Math.ceil((closingDate.getTime() - Date.now()) / 60000));
  const message = `${application.companyName} application closing time is in about ${minutesRemaining} minute${minutesRemaining === 1 ? '' : 's'}. Please submit your application before ${closingTime}.`;

  await Notification.create({
    studentId: application.studentId,
    studentName,
    companyName: application.companyName,
    message,
    type: 'Info',
  });

  if (email && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    const transporter = createMailer();
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: email,
      subject: `${application.companyName} application deadline reminder`,
      text: message,
    });
  }
}

async function processDeadlineReminders() {
  const now = new Date();
  const windowEnd = new Date(now.getTime() + REMINDER_LEAD_TIME_MINUTES * 60 * 1000);

  const candidates = await Application.find({
    deadline: { $gt: now, $lte: windowEnd },
    notificationSent: { $ne: true },
    status: { $nin: ['Rejected', 'Placed'] },
  }).select('_id studentId companyName deadline').lean();

  for (const candidate of candidates) {
    const claimed = await Application.findOneAndUpdate(
      { _id: candidate._id, notificationSent: false },
      { $set: { notificationSent: true, notificationSentAt: new Date() } },
      { returnDocument: 'after' }
    ).lean();

    if (!claimed) continue;

    try {
      await sendDeadlineReminder(claimed);
      console.log(`Deadline reminder sent for ${claimed.companyName} to ${claimed.studentId}`);
    } catch (error) {
      await Application.updateOne(
        { _id: claimed._id, notificationSent: true },
        { $set: { notificationSent: false }, $unset: { notificationSentAt: 1 } }
      );
      console.error(`Deadline reminder failed for ${claimed._id}:`, error.message);
    }
  }
}

module.exports = { processDeadlineReminders };
