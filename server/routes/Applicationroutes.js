const express = require("express");
const router = express.Router();

const {
  applyForCompany,
  getAllApplications,
  updateApplicationStatus,
  getStudentNotifications,
  markNotificationAsRead,
} = require("../controllers/applicationController");

// Student Apply
router.post("/", applyForCompany);

// Admin View
router.get("/", getAllApplications);

// Admin Approve/Reject
router.put("/:id", updateApplicationStatus);

// Student Notifications
router.get("/notifications/:studentId", getStudentNotifications);

// Mark Notification as Read
router.put("/notifications/:notificationId/read", markNotificationAsRead);

module.exports = router;