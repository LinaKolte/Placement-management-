const express = require("express");
const fs = require("fs");
const path = require("path");
const multer = require("multer");

const router = express.Router();

// Import the controller function
const { uploadDocument } = require("../controllers/StudentController");

const uploadRoot = path.join(__dirname, "..", "uploads");
fs.mkdirSync(path.join(uploadRoot, "resumes"), { recursive: true });
fs.mkdirSync(path.join(uploadRoot, "marksheets"), { recursive: true });
fs.mkdirSync(path.join(uploadRoot, "idproofs"), { recursive: true });

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const type = req.body.documentType;

    if (type === "resume") {
      cb(null, path.join(uploadRoot, "resumes"));
    } else if (type === "marksheet") {
      cb(null, path.join(uploadRoot, "marksheets"));
    } else {
      cb(null, path.join(uploadRoot, "idproofs"));
    }
  },

  filename: function (req, file, cb) {
    cb(null, Date.now() + "_" + file.originalname);
  },
});

const upload = multer({
  storage: storage,
});

router.post(
  "/upload-document",
  upload.single("document"),
  uploadDocument
);

module.exports = router;