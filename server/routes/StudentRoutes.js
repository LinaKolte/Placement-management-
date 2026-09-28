const express = require("express");
const { authenticate, allowRoles } = require('../middleware/auth');
const multer = require("multer");

const router = express.Router();

// Import the controller function
const { uploadDocument, updateProfile, getProfiles, sendProfileForVerification, getProfileVerificationStatus, getAllProfileVerifications, updateProfileVerificationStatus } = require("../controllers/StudentController");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error('Only PDF, JPG, and PNG files are allowed'));
    }
    cb(null, true);
  },
});

router.post(
  "/upload-document",
  upload.single("document"),
  uploadDocument
);
router.post("/profile", updateProfile);
router.put("/update-profile", updateProfile);
router.get("/profiles", getProfiles);
router.post("/profile-verification", sendProfileForVerification);
router.get("/profile-verification/:rollNumber", getProfileVerificationStatus);
router.get("/profile-verifications-admin", authenticate, allowRoles('admin'), getAllProfileVerifications);
router.put("/profile-verification/:verificationId", authenticate, allowRoles('admin'), updateProfileVerificationStatus);

module.exports = router;