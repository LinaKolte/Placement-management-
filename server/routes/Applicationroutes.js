const express = require("express");
const { authenticate, allowRoles } = require('../middleware/auth');
const router = express.Router();

const {
  applyForCompany,
  createAdminApplication,
  getAllApplications,
  getPlacementAnalytics,
  downloadSelectedStudents,
  updateApplicationStatus,
  updateVerificationStatus,
  addApplicationRound,
  finalizePlacement,
  scheduleInterview,
  getStudentNotifications,
  getInterviewShortlist,
  markNotificationAsRead,
  dismissNotification,
  sendEligibilityEmails,
  notifyStudents,
  deleteApplication,
  withdrawApplication,
} = require("../controllers/applicationController");

// Student Apply
router.post("/", applyForCompany);

// Admin View
router.get("/", getAllApplications);
router.delete("/:id", authenticate, allowRoles('admin'), deleteApplication);
router.put("/:id/withdraw", authenticate, allowRoles('student'), withdrawApplication);
router.get("/analytics", authenticate, allowRoles('admin'), getPlacementAnalytics);
router.get("/selected-students/download", downloadSelectedStudents);
router.get("/company-applications/download", downloadSelectedStudents);
router.post("/admin-entry", authenticate, allowRoles('admin'), createAdminApplication);

// Verification request from student / approval from admin
router.put("/:id/verify", updateVerificationStatus);

// Admin Approve/Reject
router.put("/:id", updateApplicationStatus);
router.post("/:id/schedule-interview", authenticate, allowRoles('admin'), scheduleInterview);
router.post("/:id/rounds", authenticate, allowRoles('admin'), addApplicationRound);
router.post("/:id/finalize-placement", authenticate, allowRoles('admin'), finalizePlacement);

// Send eligibility emails for a company
router.post("/send-eligibility-emails", authenticate, allowRoles('admin'), sendEligibilityEmails);

// Notify a list of students (create notifications)
router.post("/notify-students", authenticate, allowRoles('admin'), notifyStudents);

// Student Notifications
router.get("/notifications/:studentId", getStudentNotifications);
router.get("/interview-shortlist", authenticate, allowRoles('admin'), getInterviewShortlist);

// Mark Notification as Read
router.put("/notifications/:notificationId/read", markNotificationAsRead);
router.delete("/notifications/:notificationId/:studentId", dismissNotification);

module.exports = router;