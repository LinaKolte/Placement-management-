const nodemailer = require('nodemailer');
const Student = require('../models/student');
const Application = require('../models/Application');
const StudentProfile = require('../models/StudentProfile');
const { buildCompanyCriteria } = require('./companyCriteria');

const BRANCH_NAMES = {
  CSE: 'Computer Science',
  IT: 'Information Technology',
  ECE: 'Electronics & Communication',
  ME: 'Mechanical',
  MECH: 'Mechanical',
  CE: 'Civil',
  EE: 'Electrical',
  EEE: 'Electrical',
};

function normalizeBranch(branch) {
  if (!branch) return '';
  return BRANCH_NAMES[String(branch).trim().toUpperCase()] || String(branch).trim();
}

function isStudentEligibleForCompany(student, company) {
  if (!student || !company) return false;

  if (Array.isArray(company.branches) && company.branches.length > 0 && student.branch) {
    if (!company.branches.some((branch) => normalizeBranch(branch) === normalizeBranch(student.branch))) return false;
  }

  if (typeof company.minCgpa === 'number' && typeof student.cgpa === 'number' && student.cgpa < company.minCgpa) {
    return false;
  }

  if (company.noBacklogs && typeof student.backlogs === 'number' && student.backlogs > 0) {
    return false;
  }

  return true;
}

async function getEligibleStudentsForCompany(company, criteria = {}) {
  const effectiveCriteria = buildCompanyCriteria(company);
  const resolvedCriteria = { ...effectiveCriteria, ...criteria };
  const applications = await Application.find({ companyName: company.name }).lean();
  const rollNumbers = [...new Set(applications.map((application) => application.studentId).filter(Boolean))];

  if (!rollNumbers.length) {
    return [];
  }

  const profiles = await StudentProfile.find({ rollNumber: { $in: rollNumbers } }).lean();
  const students = await Student.find({ rollNumber: { $in: rollNumbers } }).lean();
  const profileByRoll = new Map(profiles.map((profile) => [profile.rollNumber, profile]));
  const studentByRoll = new Map(students.map((student) => [student.rollNumber, student]));

  const eligible = [];
  const seen = new Set();
  for (const application of applications) {
    const rollNumber = application.studentId;
    if (!rollNumber || seen.has(rollNumber)) continue;

    const student = studentByRoll.get(rollNumber) || {};
    const profile = profileByRoll.get(rollNumber) || {};

    const academicCriteria = {
      tenthPercentage: resolvedCriteria.tenthPercentage ?? null,
      twelfthPercentage: resolvedCriteria.twelfthPercentage ?? null,
    };

    const meetsAcademicCriteria =
      (academicCriteria.tenthPercentage === null || (profile.tenthPercentage ?? null) === null || (profile.tenthPercentage ?? 0) >= academicCriteria.tenthPercentage) &&
      (academicCriteria.twelfthPercentage === null || (profile.twelfthPercentage ?? null) === null || (profile.twelfthPercentage ?? 0) >= academicCriteria.twelfthPercentage);

    const isEligible = meetsAcademicCriteria && isStudentEligibleForCompany({ ...student, ...profile }, { ...company, ...resolvedCriteria });
    if (!isEligible) continue;

    eligible.push({
      ...student,
      ...profile,
      applicationStatus: application.status || 'Applied',
      isEligible,
      criteria: academicCriteria,
    });
    seen.add(rollNumber);
  }

  return eligible;
}

async function sendCompanyEligibilityEmails(company, criteria = {}) {
  const eligibleStudents = await getEligibleStudentsForCompany(company, criteria);
  const recipients = eligibleStudents.filter((student) => student.email).map((student) => student.email);

  if (!recipients.length) {
    return { sent: 0, recipients: [], message: 'No eligible students found for this company.' };
  }

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    return { sent: 0, recipients, message: 'Email credentials are not configured on the server.' };
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const subject = `Opportunity from ${company.name}`;
  const text = `Hello,\n\n${company.name} has an opportunity that matches your profile. Please check the placement portal for details.\n\nRegards,\nCampus Placement Team`;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: recipients,
    subject,
    text,
  });

  return { sent: recipients.length, recipients, message: 'Emails sent successfully.', criteria };
}

module.exports = {
  getEligibleStudentsForCompany,
  sendCompanyEligibilityEmails,
  isStudentEligibleForCompany,
};
