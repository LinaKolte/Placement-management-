const path = require("path");
const StudentProfile = require("../models/StudentProfile");

exports.uploadDocument = async (req, res) => {
  try {
    console.log(req.body);
    console.log(req.file);

    const { rollNumber, documentType } = req.body;

    if (!rollNumber) {
      return res.status(400).json({
        success: false,
        message: "Roll number is required",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    let profile = await StudentProfile.findOne({ rollNumber });

    if (!profile) {
      profile = new StudentProfile({
        rollNumber,
      });
    }

    // URL that browser can access
    const fileUrl =
      "/uploads/" +
      path.basename(path.dirname(req.file.path)) +
      "/" +
      req.file.filename;

    switch (documentType) {
      case "resume":
        profile.resume = fileUrl;
        break;

      case "marksheet":
        profile.marksheet = fileUrl;
        break;

      case "idProof":
        profile.governmentId = fileUrl;
        break;

      default:
        return res.status(400).json({
          success: false,
          message: "Invalid document type",
        });
    }

    await profile.save();

    res.status(200).json({
      success: true,
      message: "Uploaded Successfully",
      fileName: req.file.filename,
      filePath: fileUrl,
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};