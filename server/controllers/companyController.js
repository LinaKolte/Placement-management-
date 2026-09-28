const Company = require('../models/Company');
const StudentProfile = require('../models/StudentProfile');
const Notification = require('../models/Notification');
const nodemailer = require('nodemailer');

const BRANCH_ALIASES = {
  CSE: 'COMPUTER SCIENCE',
  'COMPUTER SCIENCE': 'COMPUTER SCIENCE',
  IT: 'INFORMATION TECHNOLOGY',
  'INFORMATION TECHNOLOGY': 'INFORMATION TECHNOLOGY',
  ECE: 'ELECTRONICS & COMMUNICATION',
  'ELECTRONICS & COMMUNICATION': 'ELECTRONICS & COMMUNICATION',
  ME: 'MECHANICAL',
  MECH: 'MECHANICAL',
  MECHANICAL: 'MECHANICAL',
};

function normalizeBranch(branch) {
  const value = String(branch || '').trim().toUpperCase();
  return BRANCH_ALIASES[value] || value;
}

function isEligibleForDrive(student, company) {
  const branchMatches = !company.branches.length || company.branches.some((branch) => (
    normalizeBranch(branch) === normalizeBranch(student.branch)
  ));
  const cgpaMatches = company.minCgpa === null || company.minCgpa === undefined || student.cgpa >= company.minCgpa;
  const tenthMatches = company.minTenthPercentage === null || company.minTenthPercentage === undefined || student.tenthPercentage >= company.minTenthPercentage;
  const twelfthMatches = company.minTwelfthPercentage === null || company.minTwelfthPercentage === undefined || student.twelfthPercentage >= company.minTwelfthPercentage;
  const backlogMatches = company.maxBacklogs !== null && company.maxBacklogs !== undefined
    ? Number(student.backlogs || 0) <= company.maxBacklogs
    : (!company.noBacklogs || student.backlogs === 0);

  return branchMatches && cgpaMatches && tenthMatches && twelfthMatches && backlogMatches;
}

function validateCriteria(body) {
  const fields = ['minCgpa', 'minTenthPercentage', 'minTwelfthPercentage', 'maxBacklogs'];
  for (const field of fields) {
    if (body[field] !== undefined && body[field] !== null && !Number.isFinite(Number(body[field]))) {
      return `${field} must be a number`;
    }
  }
  return null;
}

exports.getCompanies = async (req, res) => {
  try {
    const query = req.query.includeClosed === 'true' ? {} : { status: { $ne: 'Closed' } };
    const companies = await Company.find(query).sort({ deadline: 1, name: 1 }).lean();
    res.json(companies);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createCompany = async (req, res) => {
  try {
    if (!req.body.name || !req.body.role) {
      return res.status(400).json({ success: false, message: 'Company name and role are required' });
    }
    const criteriaError = validateCriteria(req.body);
    if (criteriaError) return res.status(400).json({ success: false, message: criteriaError });
    const company = await Company.create({ ...req.body, minCgpa: req.body.minCgpa === '' ? null : req.body.minCgpa });
    const students = await StudentProfile.find({})
      .select('rollNumber name email branch cgpa tenthPercentage twelfthPercentage backlogs')
      .lean();
    const eligibleStudents = students.filter((student) => isEligibleForDrive(student, company));
    const message = `${company.name} has announced a new placement drive for ${company.role}. Check the placement portal for eligibility, details, and the application deadline.`;
    const notifications = eligibleStudents
      .filter((student) => student.rollNumber)
      .map((student) => ({
        studentId: student.rollNumber,
        studentName: student.name || `Student ${student.rollNumber}`,
        companyName: company.name,
        message,
        type: 'Recruitment',
      }));

    if (notifications.length) await Notification.insertMany(notifications);

    let emailSent = 0;
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      const recipients = eligibleStudents.map((student) => student.email).filter(Boolean);
      if (recipients.length) {
        try {
          const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
          });
          await transporter.sendMail({
            from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
            to: recipients,
            subject: `New placement drive: ${company.name}`,
            text: `${message}\n\nRegards,\nCampus Placement Team`,
          });
          emailSent = recipients.length;
        } catch (mailError) {
          console.error('createCompany: email send failed', mailError);
        }
      }
    }

    res.status(201).json({ success: true, company, eligibleStudents: eligibleStudents.length, notifiedStudents: notifications.length, emailSent });
  } catch (error) {
    res.status(error.code === 11000 ? 409 : 500).json({ success: false, message: error.code === 11000 ? 'Company drive already exists' : error.message });
  }
};

exports.updateCompany = async (req, res) => {
  try {
    const criteriaError = validateCriteria(req.body);
    if (criteriaError) return res.status(400).json({ success: false, message: criteriaError });
    const company = await Company.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after', runValidators: true });
    if (!company) return res.status(404).json({ success: false, message: 'Company drive not found' });
    res.json({ success: true, company });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteCompany = async (req, res) => {
  try {
    const company = await Company.findByIdAndUpdate(req.params.id, { status: 'Closed' }, { returnDocument: 'after' });
    if (!company) return res.status(404).json({ success: false, message: 'Company drive not found' });
    res.json({ success: true, company, message: 'Company drive closed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};