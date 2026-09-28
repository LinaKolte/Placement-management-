const Application = require("../models/Application");
const Student = require("../models/student");
const StudentProfile = require("../models/StudentProfile");
const Company = require("../models/Company");
const Notification = require("../models/Notification");
const InterviewShortlist = require("../models/InterviewShortlist");
const { isOfferAllowed, normalizeOfferPackage } = require("../utils/offerPolicy");
const { sendCompanyEligibilityEmails } = require("../utils/eligibilityMail");
const { normalizeVerificationStatus, canSetVerificationStatus } = require("../utils/verification");
const { validateInterviewSchedule, findInterviewConflict } = require("../utils/interviewSchedule");
const {
  normalizePlacementStatus,
  normalizeRoundName,
  canTransitionPlacementStatus,
} = require("../utils/placementLifecycle");
const nodemailer = require('nodemailer');

// Student Apply
exports.applyForCompany = async (req, res) => {
  try {
    const { studentId, companyId, companyName, package: offeredPackage } = req.body;

    // Check student exists
    const student = await StudentProfile.findOne({
      rollNumber: studentId,
    });

    if (!student) {
      return res.status(404).json({
        message: "Student not found",
      });
    }

    let company = null;
    if (typeof companyId === 'string' && /^[a-f\d]{24}$/i.test(companyId)) {
      company = await Company.findById(companyId).lean();
    }

    if (company) {
      const now = new Date();
      if (company.status === 'Closed' || (company.applicationStart && new Date(company.applicationStart) > now) || (company.deadline && new Date(company.deadline) < now)) {
        return res.status(400).json({ message: "This placement drive is closed" });
      }
      const branchMatches = !company.branches.length || company.branches.some((branch) =>
        String(branch).trim().toLowerCase() === String(student.branch || '').trim().toLowerCase() ||
        (String(branch).trim().toUpperCase() === 'CSE' && String(student.branch || '').trim().toUpperCase() === 'COMPUTER SCIENCE') ||
        (String(branch).trim().toUpperCase() === 'IT' && String(student.branch || '').trim().toUpperCase() === 'INFORMATION TECHNOLOGY')
      );
      const cgpaMatches = company.minCgpa === null || student.cgpa >= company.minCgpa;
      const tenthMatches = company.minTenthPercentage === null || student.tenthPercentage >= company.minTenthPercentage;
      const twelfthMatches = company.minTwelfthPercentage === null || student.twelfthPercentage >= company.minTwelfthPercentage;
      const backlogMatches = company.maxBacklogs !== null && company.maxBacklogs !== undefined
        ? Number(student.backlogs || 0) <= company.maxBacklogs
        : (!company.noBacklogs || student.backlogs === 0);
      if (!branchMatches || !cgpaMatches || !tenthMatches || !twelfthMatches || !backlogMatches) {
        return res.status(400).json({ message: "You are not eligible for this placement drive" });
      }
    }

    // Already applied?
    const exists = await Application.findOne({
      studentId,
      companyId,
    });

    if (exists) {
      return res.status(400).json({
        message: "Already applied",
      });
    }

    const documents = [];

    if (student.resume) {
      documents.push({
        documentType: "resume",
        fileName: student.resume.split(/[\\/]/).pop(),
        filePath: student.resume,
      });
    }

    if (student.marksheet) {
      documents.push({
        documentType: "marksheet",
        fileName: student.marksheet.split(/[\\/]/).pop(),
        filePath: student.marksheet,
      });
    }

    if (student.governmentId) {
      documents.push({
        documentType: "idProof",
        fileName: student.governmentId.split(/[\\/]/).pop(),
        filePath: student.governmentId,
      });
    }

    const application = new Application({
      studentId,
      companyId,
      companyName,
      deadline: company?.deadline || null,
      documents,
      package: offeredPackage || "",
      verificationStatus: "Pending",
    });

    await application.save();

    res.status(201).json({
      message: "Application submitted successfully",
      application,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: err.message,
    });
  }
};

exports.createAdminApplication = async (req, res) => {
  try {
    const { studentName, rollNumber, email, branch, companyName, companyId, package: offeredPackage, status } = req.body;
    const allowedStatuses = ["Applied", "Shortlisted", "Selected", "Rejected"];

    if (!studentName?.trim() || !rollNumber?.trim() || !companyName?.trim()) {
      return res.status(400).json({ message: "Student name, roll number, and company name are required" });
    }
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid application status" });
    }

    let student = await StudentProfile.findOne({ rollNumber: rollNumber.trim() });
    if (!student) {
      student = await StudentProfile.create({
        rollNumber: rollNumber.trim(),
        name: studentName.trim(),
        email: email?.trim() || "",
        branch: branch?.trim() || "",
      });
    } else {
      student.name = studentName.trim();
      if (email?.trim()) student.email = email.trim();
      if (branch?.trim()) student.branch = branch.trim();
      await student.save();
    }

    const existingApplication = await Application.findOne({
      studentId: student.rollNumber,
      companyName: companyName.trim(),
    });
    if (existingApplication) {
      return res.status(409).json({ message: "This student already has an application for this company" });
    }

    let resolvedCompanyId = companyId?.trim() || companyName.trim();
    let companyDeadline = null;
    if (!companyId && /^[a-f\d]{24}$/i.test(companyName.trim())) {
      resolvedCompanyId = companyName.trim();
    } else {
      const company = await Company.findOne({ name: companyName.trim() }).lean();
      if (company) {
        resolvedCompanyId = String(company._id);
        companyDeadline = company.deadline || null;
      }
    }

    const application = await Application.create({
      studentId: student.rollNumber,
      companyId: resolvedCompanyId,
      companyName: companyName.trim(),
      deadline: companyDeadline,
      package: offeredPackage?.trim() || "",
      status,
      verificationStatus: "Verified",
      verificationNote: "Added by admin",
      verifiedBy: req.user?.name || "Admin",
      verificationUpdatedAt: new Date(),
    });

    res.status(201).json({ message: "Placement record added successfully", application });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin View All Applications
exports.getAllApplications = async (req, res) => {
  try {
    const apps = await Application.find().sort({ createdAt: -1 }).lean();

    const rollNumbers = [...new Set(apps.map((app) => app.studentId).filter(Boolean))];
    const students = await Student.find({ rollNumber: { $in: rollNumbers } }).lean();
    const profiles = await StudentProfile.find({ rollNumber: { $in: rollNumbers } }).lean();

    const studentsByRoll = new Map();
    students.forEach((student) => studentsByRoll.set(student.rollNumber, student));
    profiles.forEach((profile) => {
      const existing = studentsByRoll.get(profile.rollNumber) || {};
      studentsByRoll.set(profile.rollNumber, { ...existing, ...profile });
    });

    const applications = apps.map((app) => {
      const studentData = studentsByRoll.get(app.studentId) || {};
      const company = {
        id: app.companyId || app.companyName || '',
        name: app.companyName || 'Unknown company',
        role: '',
        package: '',
        minCgpa: null,
        branches: [],
        noBacklogs: false,
        status: '',
        deadline: '',
      };

      const documents = Array.isArray(app.documents)
        ? app.documents.map((doc, index) => {
            let filePath = (doc.filePath || doc.filepath || '').toString();
            filePath = filePath.replace(/\\/g, '/');
            const uploadsIndex = filePath.toLowerCase().indexOf('/uploads/');
            if (uploadsIndex !== -1) {
              filePath = filePath.slice(uploadsIndex);
            } else if (filePath.toLowerCase().startsWith('uploads/')) {
              filePath = `/${filePath}`;
            }
            return {
              id: `${app._id || app.id}-${index}`,
              name: doc.fileName || doc.name || 'Document',
              type:
                doc.documentType === 'marksheet'
                  ? 'Marksheet'
                  : doc.documentType === 'idProof'
                  ? 'Government ID'
                  : doc.documentType === 'resume'
                  ? 'Resume'
                  : doc.documentType || 'Document',
              size: doc.size || '—',
              uploadedOn: app.createdAt
                ? new Date(app.createdAt).toLocaleDateString('en-US', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })
                : 'Unknown',
              filePath,
              url: filePath || '#',
            };
          })
        : [];

      const student = {
        id: studentData._id || app.studentId,
        name: studentData.fullName || 'Unknown student',
        rollNumber: app.studentId,
        branch: studentData.branch || '',
        cgpa: typeof studentData.cgpa === 'number' ? studentData.cgpa : null,
        backlogs: typeof studentData.backlogs === 'number' ? studentData.backlogs : null,
        documents,
      };

      return {
        ...app,
        status: app.status === 'Pending' ? 'Applied' : app.status,
        company,
        student,
        appliedOn: app.createdAt
          ? new Date(app.createdAt).toLocaleDateString('en-US', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })
          : '',
        documents,
      };
    });

    res.json(applications);
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

exports.deleteApplication = async (req, res) => {
  try {
    const application = await Application.findByIdAndDelete(req.params.id);
    if (!application) return res.status(404).json({ message: 'Application not found' });
    res.json({ message: 'Application removed successfully', applicationId: application._id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getPlacementAnalytics = async (req, res) => {
  try {
    const [total, placed, selected, shortlisted, rejected, byCompany] = await Promise.all([
      Application.countDocuments(),
      Application.countDocuments({ status: 'Placed' }),
      Application.countDocuments({ status: 'Selected' }),
      Application.countDocuments({ status: 'Shortlisted' }),
      Application.countDocuments({ status: 'Rejected' }),
      Application.aggregate([
        { $group: { _id: '$companyName', applications: { $sum: 1 }, placed: { $sum: { $cond: [{ $eq: ['$status', 'Placed'] }, 1, 0] } }, selected: { $sum: { $cond: [{ $eq: ['$status', 'Selected'] }, 1, 0] } } } },
        { $sort: { applications: -1 } },
      ]),
    ]);
    res.json({
      total,
      placed,
      selected,
      shortlisted,
      rejected,
      placedPercentage: total ? Number(((placed / total) * 100).toFixed(2)) : 0,
      byCompany,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.downloadSelectedStudents = async (req, res) => {
  try {
    const { companyId, companyName, status = "Selected" } = req.query;
    if (!companyId && !companyName) {
      return res.status(400).json({ message: "companyId or companyName is required" });
    }

    const companyFilter = companyId
      ? { companyId: String(companyId) }
      : { companyName: String(companyName) };
    const applicationFilter = status === "all" ? companyFilter : { ...companyFilter, status };
    const applications = await Application.find(applicationFilter)
      .sort({ updatedAt: -1 })
      .lean();
    const rollNumbers = applications.map((application) => application.studentId).filter(Boolean);
    const profiles = await StudentProfile.find({ rollNumber: { $in: rollNumbers } }).lean();
    const students = await Student.find({ rollNumber: { $in: rollNumbers } }).lean();
    const studentsByRoll = new Map();

    [...students, ...profiles].forEach((student) => {
      studentsByRoll.set(student.rollNumber, student);
    });

    const escapeCsv = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
    const rows = [
      ["Student name", "Roll number", "Branch", "Email", "Company", "Package", "Status", "Updated on"],
      ...applications.map((application) => {
        const student = studentsByRoll.get(application.studentId) || {};
        return [
          student.fullName || student.name || `Student ${application.studentId}`,
          application.studentId,
          student.branch,
          student.email,
          application.companyName,
          application.package,
          application.status,
          application.updatedAt ? new Date(application.updatedAt).toISOString() : "",
        ];
      }),
    ];
    const csv = rows.map((row) => row.map(escapeCsv).join(",")).join("\r\n");
    const fileSuffix = status === "all" ? "applicants" : "selected-students";
    const fileName = `${String(companyName || applications[0]?.companyName || "company")
      .replace(/[^a-z0-9]+/gi, "-")
      .replace(/^-|-$/g, "") || "company"}-${fileSuffix}.csv`;

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.send(csv);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update Status
exports.updateApplicationStatus = async (req, res) => {
  try {
    const { status, package: offeredPackage, verificationStatus, verificationNote, verifiedBy } = req.body;

    const existingApplication = await Application.findById(req.params.id);
    if (!existingApplication) {
      return res.status(404).json({ message: "Application not found" });
    }

    const nextStatus = normalizePlacementStatus(status);
    if (!canTransitionPlacementStatus(existingApplication.status, nextStatus)) {
      return res.status(400).json({
        message: `Cannot move an application from ${existingApplication.status} to ${nextStatus}. Follow the placement sequence: Applied, Shortlisted, Interview Scheduled, Selected, Placed.`,
      });
    }

    if (nextStatus === 'Selected' && !existingApplication.rounds.some((round) => round.status === 'Qualified')) {
      return res.status(400).json({
        message: 'Record at least one qualified interview round before selecting this student.',
      });
    }

    const existingOffers = await Application.find({
      studentId: existingApplication.studentId,
      status: { $in: ["Shortlisted", "Selected"] },
      _id: { $ne: existingApplication._id },
    }).lean();

    const highestExistingPackage = existingOffers.reduce((highest, app) => {
      const packageValue = app.package || app.companyPackage || app.offerPackage;
      const numericValue = normalizeOfferPackage(packageValue);
      if (numericValue === null) return highest;
      return highest === null || numericValue > highest ? numericValue : highest;
    }, null);

    if (nextStatus === "Shortlisted" || nextStatus === "Selected") {
      const nextPackage = offeredPackage || existingApplication.package || "";
      if (highestExistingPackage !== null && !isOfferAllowed(highestExistingPackage, nextPackage)) {
        return res.status(400).json({
          message: `This offer is below the required threshold. A student cannot receive an offer below double the existing package (${highestExistingPackage} LPA).`,
        });
      }
    }

    const update = {
      status: nextStatus,
      package: offeredPackage || existingApplication.package,
    };

    if (verificationStatus !== undefined) {
      const normalizedVerificationStatus = normalizeVerificationStatus(verificationStatus);
      if (!canSetVerificationStatus(existingApplication.verificationStatus, normalizedVerificationStatus)) {
        return res.status(400).json({
          message: `Verification status cannot move from ${existingApplication.verificationStatus || 'Pending'} to ${normalizedVerificationStatus}.`,
        });
      }
      update.verificationStatus = normalizedVerificationStatus;
      update.verificationNote = verificationNote || existingApplication.verificationNote || "";
      update.verifiedBy = verifiedBy || existingApplication.verifiedBy || "Admin";
      update.verificationUpdatedAt = new Date();
    }

    const application = await Application.findByIdAndUpdate(
      req.params.id,
      update,
      {
        returnDocument: 'after',
      }
    );

    const statusChanged = existingApplication.status !== nextStatus;
    if (application && statusChanged && nextStatus === 'Shortlisted') {
      await InterviewShortlist.findOneAndUpdate(
        { applicationId: application._id },
        {
          applicationId: application._id,
          studentId: application.studentId,
          companyId: application.companyId,
          companyName: application.companyName,
          status: 'Shortlisted',
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }

    // Get student details for notification
    if (application && statusChanged && ['Interview Scheduled', 'Selected', 'Placed', 'Rejected'].includes(nextStatus)) {
      await InterviewShortlist.updateOne(
        { applicationId: application._id },
        { $set: { status: nextStatus } }
      );
    }

    if (application && statusChanged && ["Shortlisted", "Selected", "Placed", "Rejected"].includes(nextStatus)) {
      const student = await StudentProfile.findOne({
        rollNumber: application.studentId,
      });

      if (student) {
        let message = "";
        if (nextStatus === "Shortlisted") {
          message = `Congratulations! You have been selected for an interview with ${application.companyName}. We wish you the very best for the next round!`;
        } else if (nextStatus === "Selected") {
          message = `Great news! You have been selected by ${application.companyName}. Welcome to the team!`;
        } else if (nextStatus === "Placed") {
          message = `Your placement at ${application.companyName} is now confirmed.`;
        } else if (nextStatus === "Rejected") {
          message = `Unfortunately, your application for ${application.companyName} was not selected this time. Better luck next time!`;
        }

        // Create notification
        const notification = new Notification({
          studentId: application.studentId,
          studentName: student.fullName || `Student ${application.studentId}`,
          companyName: application.companyName,
          message,
          type: nextStatus,
        });

        await notification.save();

        if (nextStatus === "Shortlisted" && student.email && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
          try {
            const transporter = nodemailer.createTransport({
              service: 'gmail',
              auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
            });
            await transporter.sendMail({
              from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
              to: student.email,
              subject: `Shortlisted for ${application.companyName}`,
              text: message,
            });
            console.log(`Shortlist email sent to ${student.email} for ${application.companyName}`);
          } catch (mailError) {
            console.error('Shortlist email failed:', mailError.message);
          }
        }
      }
    }

    res.json(application);
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

exports.updateVerificationStatus = async (req, res) => {
  try {
    const { verificationStatus, verificationNote, verifiedBy } = req.body;
    const existingApplication = await Application.findById(req.params.id);

    if (!existingApplication) {
      return res.status(404).json({ message: "Application not found" });
    }

    const normalizedVerificationStatus = normalizeVerificationStatus(verificationStatus ?? existingApplication.verificationStatus);
    if (!canSetVerificationStatus(existingApplication.verificationStatus, normalizedVerificationStatus)) {
      return res.status(400).json({
        message: `Verification status cannot move from ${existingApplication.verificationStatus || 'Pending'} to ${normalizedVerificationStatus}.`,
      });
    }

    const updatedApplication = await Application.findByIdAndUpdate(
      req.params.id,
      {
        verificationStatus: normalizedVerificationStatus,
        verificationNote: verificationNote || existingApplication.verificationNote || "",
        verifiedBy: verifiedBy || existingApplication.verifiedBy || "Admin",
        verificationUpdatedAt: new Date(),
      },
      { returnDocument: 'after' }
    );

    res.json(updatedApplication);
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

exports.addApplicationRound = async (req, res) => {
  try {
    const { roundName, date, time, location, score, feedback, status } = req.body;
    const application = await Application.findById(req.params.id);

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    if (!['Shortlisted', 'Interview Scheduled', 'Selected'].includes(application.status)) {
      return res.status(400).json({
        success: false,
        message: 'Shortlist the student and schedule the interview before recording a round.',
      });
    }

    const nextRoundName = normalizeRoundName(roundName || `Round ${application.rounds.length + 1}`);
    const roundEntry = {
      roundName: nextRoundName,
      roundNumber: application.rounds.length + 1,
      date: date || '',
      time: time || '',
      location: location || '',
      score: score || '',
      feedback: feedback || '',
      status: status || 'Pending',
      createdAt: new Date(),
    };

    const previousStatus = application.status;
    application.rounds.push(roundEntry);
    if (status === 'Rejected') application.status = 'Rejected';
    if (status === 'Qualified' && application.status === 'Interview Scheduled') application.status = 'Selected';
    await application.save();

    if (previousStatus === 'Interview Scheduled' && application.status === 'Selected') {
      await InterviewShortlist.updateOne(
        { applicationId: application._id },
        { $set: { status: 'Selected' } }
      );

      const student = await StudentProfile.findOne({ rollNumber: application.studentId });
      if (student) {
        await Notification.create({
          studentId: application.studentId,
          studentName: student.fullName || student.name || `Student ${application.studentId}`,
          companyName: application.companyName,
          message: `Congratulations! You have been selected after the interview for ${application.companyName}.`,
          type: 'Selected',
        });
      }
    }

    res.json({ success: true, message: 'Round result saved', application });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.finalizePlacement = async (req, res) => {
  try {
    const { finalStatus = 'Placed', package: offeredPackage } = req.body;
    const application = await Application.findById(req.params.id);

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    if (finalStatus === 'Placed' && application.status !== 'Selected') {
      return res.status(400).json({
        success: false,
        message: 'Only selected students can be marked as placed. Complete the interview rounds first.',
      });
    }

    application.status = finalStatus === 'Placed' ? 'Placed' : 'Rejected';
    if (offeredPackage) application.package = offeredPackage;
    await application.save();

    res.json({ success: true, message: 'Placement status updated', application });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.scheduleInterview = async (req, res) => {
  try {
    const { date, time, round, location, panel, notes } = req.body;
    const validation = validateInterviewSchedule({ date, time, round, location, panel, notes });

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.errors[0],
      });
    }

    const application = await Application.findById(req.params.id);
    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    if (!['Shortlisted', 'Interview Scheduled'].includes(application.status)) {
      return res.status(400).json({
        success: false,
        message: 'Only shortlisted students can be scheduled for an interview.',
      });
    }

    const scheduledAtSlot = await InterviewShortlist.find({
      status: 'Interview Scheduled',
      'interviewSchedule.date': validation.normalized.date,
      'interviewSchedule.time': validation.normalized.time,
    }).lean();
    const conflict = findInterviewConflict(scheduledAtSlot, {
      date: validation.normalized.date,
      time: validation.normalized.time,
      panel: validation.normalized.panel,
      location: validation.normalized.location,
      studentId: application.studentId,
    }, application._id);

    if (conflict) {
      const conflictSchedule = conflict.interviewSchedule || {};
      const conflictReason = String(conflict.studentId) === String(application.studentId)
        ? 'This student already has another interview at that time.'
        : validation.normalized.panel && String(conflictSchedule.panel || '').trim().toLowerCase() === validation.normalized.panel.toLowerCase()
          ? `Panel ${validation.normalized.panel} is already booked at that time.`
          : `Location ${validation.normalized.location} is already booked at that time.`;
      return res.status(409).json({ success: false, message: conflictReason });
    }

    const interviewSchedule = {
      date: validation.normalized.date,
      time: validation.normalized.time,
      round: validation.normalized.round || "Round 1",
      location: validation.normalized.location,
      panel: validation.normalized.panel,
      notes: validation.normalized.notes,
      scheduledAt: new Date(),
    };

    application.interviewSchedule = interviewSchedule;
    application.status = "Interview Scheduled";
    await application.save();

    await InterviewShortlist.findOneAndUpdate(
      { applicationId: application._id },
      {
        applicationId: application._id,
        studentId: application.studentId,
        companyId: application.companyId,
        companyName: application.companyName,
        status: 'Interview Scheduled',
        interviewSchedule,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const student = await StudentProfile.findOne({ rollNumber: application.studentId });
    if (student) {
      const notification = new Notification({
        studentId: application.studentId,
        studentName: student.fullName || student.name || `Student ${application.studentId}`,
        companyName: application.companyName,
        message: `Congratulations! You have been selected for an interview with ${application.companyName}. Your interview is scheduled on ${interviewSchedule.date} at ${interviewSchedule.time} at ${interviewSchedule.location}.`,
        type: "Recruitment",
      });
      await notification.save();
    }

    res.json({
      success: true,
      message: "Interview scheduled successfully",
      application,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.sendEligibilityEmails = async (req, res) => {
  try {
    const { company, criteria } = req.body;

    if (!company || !company.name) {
      return res.status(400).json({ success: false, message: "Company details are required" });
    }

    const result = await sendCompanyEligibilityEmails(company, criteria || {});
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: create notifications for an explicit list of students
exports.notifyStudents = async (req, res) => {
  try {
    const { rollNumbers, message, companyName, type, subject } = req.body;

    if (!Array.isArray(rollNumbers) || rollNumbers.length === 0) {
      return res.status(400).json({ success: false, message: 'rollNumbers array is required' });
    }

    const profiles = await StudentProfile.find({ rollNumber: { $in: rollNumbers } }).lean();
    if (!profiles || profiles.length === 0) {
      return res.json({ success: true, sent: 0, emailSent: 0, recipients: [] });
    }

    const finalSubject = subject || (companyName ? `${companyName} — Notification` : 'Placement Office Notification');
    const finalMessage = message || 'Announcement from placement office';

    const docs = profiles.map((p) => ({
      studentId: p.rollNumber,
      studentName: p.name || p.fullName || `Student ${p.rollNumber}`,
      companyName: companyName || 'Admin',
      message: finalMessage,
      type: type || 'Info',
    }));

    await Notification.insertMany(docs);

    let emailSent = 0;
    let emailStatus = 'No email credentials configured';

    try {
      const recipients = profiles.map((p) => p.email).filter(Boolean);
      if (!recipients.length) {
        emailStatus = 'No email addresses found for selected students';
      } else if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
        });

        const mailOptions = {
          from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
          to: recipients,
          subject: finalSubject,
          text: finalMessage,
        };

        await transporter.sendMail(mailOptions);
        emailSent = recipients.length;
        emailStatus = 'Email sent successfully';
      }
    } catch (mailErr) {
      console.error('notifyStudents: email send failed', mailErr);
      emailStatus = 'Email send failed';
    }

    return res.json({
      success: true,
      sent: docs.length,
      emailSent,
      emailStatus,
      recipients: profiles.map((p) => p.rollNumber),
    });
  } catch (err) {
    console.error('notifyStudents error', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get Student Notifications
exports.getStudentNotifications = async (req, res) => {
  try {
    const { studentId } = req.params;

    const notifications = await Notification.find({ studentId })
      .sort({ createdAt: -1 });

    res.json(notifications);
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

// Admin: view interview shortlist records for one company drive
exports.getInterviewShortlist = async (req, res) => {
  try {
    const { companyId, companyName } = req.query;
    const query = {};
    if (companyId) query.companyId = companyId;
    if (companyName) query.companyName = companyName;

    const shortlist = await InterviewShortlist.find(query).sort({ createdAt: -1 }).lean();
    const rollNumbers = [...new Set(shortlist.map((record) => record.studentId).filter(Boolean))];
    const profiles = await StudentProfile.find({ rollNumber: { $in: rollNumbers } })
      .select('rollNumber name email branch cgpa')
      .lean();
    const profilesByRoll = new Map(profiles.map((profile) => [profile.rollNumber, profile]));

    res.json(shortlist.map((record) => ({
      ...record,
      student: profilesByRoll.get(record.studentId) || {
        rollNumber: record.studentId,
        name: `Student ${record.studentId}`,
      },
    })));
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Mark Notification as Read
exports.markNotificationAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;

    const notification = await Notification.findByIdAndUpdate(
      notificationId,
      { read: true },
      { returnDocument: 'after' }
    );

    res.json(notification);
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

// Student: dismiss one notification from their notification list
exports.dismissNotification = async (req, res) => {
  try {
    const { notificationId, studentId } = req.params;
    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      studentId,
    });

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    res.json({ success: true, message: 'Notification dismissed' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};