const Application = require("../models/Application");
const Student = require("../models/student");
const StudentProfile = require("../models/StudentProfile");
const Notification = require("../models/Notification");

// Student Apply
exports.applyForCompany = async (req, res) => {
  try {
    const { studentId, companyId, companyName } = req.body;

    // Check student exists
    const student = await StudentProfile.findOne({
      rollNumber: studentId,
    });

    if (!student) {
      return res.status(404).json({
        message: "Student not found",
      });
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
      documents,
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

// Update Status
exports.updateApplicationStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const application = await Application.findByIdAndUpdate(
      req.params.id,
      {
        status,
      },
      {
        new: true,
      }
    );

    // Get student details for notification
    if (application && ["Shortlisted", "Selected", "Rejected"].includes(status)) {
      const student = await StudentProfile.findOne({
        rollNumber: application.studentId,
      });

      if (student) {
        let message = "";
        if (status === "Shortlisted") {
          message = `Congratulations! You have been shortlisted for the campus drive at ${application.companyName}. Good luck with the next round!`;
        } else if (status === "Selected") {
          message = `Great news! You have been selected by ${application.companyName}. Welcome to the team!`;
        } else if (status === "Rejected") {
          message = `Unfortunately, your application for ${application.companyName} was not selected this time. Better luck next time!`;
        }

        // Create notification
        const notification = new Notification({
          studentId: application.studentId,
          studentName: student.fullName || `Student ${application.studentId}`,
          companyName: application.companyName,
          message,
          type: status,
        });

        await notification.save();
      }
    }

    res.json(application);
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
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

// Mark Notification as Read
exports.markNotificationAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;

    const notification = await Notification.findByIdAndUpdate(
      notificationId,
      { read: true },
      { new: true }
    );

    res.json(notification);
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};