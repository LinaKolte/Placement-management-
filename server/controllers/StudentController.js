const path = require("node:path");
const fs = require("node:fs");
const { put } = require("@vercel/blob");
const StudentProfile = require("../models/StudentProfile");
const Student = require("../models/student");
const Application = require("../models/Application");
const ProfileVerification = require("../models/ProfileVerification");
const Notification = require("../models/Notification");

const normalizeNumberField = (value, fallback = null) => {
  if (value === undefined || value === null || value === '') return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const getUploadDirectory = (documentType) => {
  switch (documentType) {
    case "resume":
      return "resumes";
    case "marksheet":
    case "tenthMarksheet":
    case "twelfthMarksheet":
    case "semesterMarksheets":
      return "marksheets";
    case "profilePhoto":
      return "profilePhotos";
    default:
      return "idproofs";
  }
};

const uploadFileToStorage = async (file, documentType) => {
  if (!file) {
    throw new Error("No file uploaded");
  }

  const safeName = `${Date.now()}_${(file.originalname || "document").replace(/[^a-zA-Z0-9_.-]/g, "_")}`;

  if (process.env.NODE_ENV === "production" && process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(`student-portal/${documentType || "misc"}/${safeName}`, file.buffer, {
      access: "public",
      contentType: file.mimetype || "application/octet-stream",
    });
    return blob.url;
  }

  const storageDir = path.join(__dirname, "..", "uploads", getUploadDirectory(documentType));
  fs.mkdirSync(storageDir, { recursive: true });

  const targetPath = path.join(storageDir, safeName);
  fs.writeFileSync(targetPath, file.buffer);

  return `/${path.join("uploads", getUploadDirectory(documentType), safeName).split(path.sep).join("/")}`;
};

exports.normalizeNumberField = normalizeNumberField;

exports.updateProfile = async (req, res) => {
  try {
    const {
      rollNumber,
      name,
      email,
      phone,
      address,
      branch,
      skills,
      certifications,
      projects,
      linkedin,
      github,
      portfolio,
      profilePhoto,
      cgpa,
      graduationYear,
      backlogs,
      tenthPercentage,
      diplomaPercentage,
      graduationMarks,
      twelfthPercentage,
    } = req.body;

    if (!rollNumber) {
          return res.status(400).json({ success: false, message: "Roll number is required" });
    }

    const toNumberOrNull = (value, min, max, label) => {
      if (value === undefined || value === null || value === '') return null;
      const parsed = Number(value);
      if (!Number.isFinite(parsed)) {
        throw new Error(`${label} must be a valid number`);
      }
      if (parsed < min || parsed > max) {
        throw new Error(`${label} must be between ${min} and ${max}`);
      }
      return parsed;
    };

    let profile = await StudentProfile.findOne({ rollNumber });

    if (!profile) {
      profile = new StudentProfile({ rollNumber });
    }

    if (name !== undefined) profile.name = name;
    if (email !== undefined) profile.email = email;
    if (phone !== undefined) profile.phone = phone;
    if (address !== undefined) profile.address = address;
    if (branch !== undefined) profile.branch = branch;
    if (skills !== undefined) profile.skills = skills;
    if (certifications !== undefined) profile.certifications = certifications;
    if (projects !== undefined) profile.projects = projects;
    if (linkedin !== undefined) profile.linkedin = linkedin;
    if (github !== undefined) profile.github = github;
    if (portfolio !== undefined) profile.portfolio = portfolio;
    if (profilePhoto !== undefined) profile.profilePhoto = profilePhoto;
    if (cgpa !== undefined) profile.cgpa = toNumberOrNull(cgpa, 0, 10, 'CGPA');
    if (graduationYear !== undefined) profile.graduationYear = graduationYear;
    if (backlogs !== undefined) profile.backlogs = toNumberOrNull(backlogs, 0, 100, 'Backlogs');
    if (tenthPercentage !== undefined) profile.tenthPercentage = toNumberOrNull(tenthPercentage, 0, 100, '10th percentage');
    if (twelfthPercentage !== undefined) profile.twelfthPercentage = toNumberOrNull(twelfthPercentage, 0, 100, '12th percentage');
    if (diplomaPercentage !== undefined) profile.diplomaPercentage = toNumberOrNull(diplomaPercentage, 0, 100, 'Diploma percentage');
    if (graduationMarks !== undefined) profile.graduationMarks = toNumberOrNull(graduationMarks, 0, 100, 'Graduation marks');

    await profile.save();

    res.status(200).json({ success: true, message: "Profile updated successfully", profile });
  } catch (err) {
    const message = err?.message || 'Failed to update profile';
    res.status(400).json({ success: false, message });
  }
};

exports.getProfiles = async (req, res) => {
  try {
    const {
      minCgpa,
      cgpa,
      studentCgpaFilter,
      branch,
      search,
      twelfthPercentage,
      minTwelfthPercentage,
      studentTwelfthFilter,
      twelfth,
    } = req.query;

    const parseNumber = (value) => {
      if (value === undefined || value === null || String(value).trim() === '') return null;
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    };

    const minCgpaNum = parseNumber(minCgpa ?? cgpa ?? studentCgpaFilter);
    const minTwelfthNum = parseNumber(minTwelfthPercentage ?? twelfthPercentage ?? studentTwelfthFilter ?? twelfth);

    const queryParts = [];

    if (branch) {
      const branches = String(branch).split(',').map((v) => v.trim()).filter(Boolean);
      if (branches.length === 1) {
        const escaped = branches[0].replace(/[.*+?^${}()|[\\]\\]/g, String.raw`\\$&`);
        queryParts.push({ branch: { $regex: new RegExp(`^${escaped}$`, 'i') } });
      } else if (branches.length > 1) {
        const regexBranches = branches.map((b) => {
          const escapedBranch = b.replace(/[.*+?^${}()|[\\]\\]/g, String.raw`\\$&`);
          return new RegExp(`^${escapedBranch}$`, 'i');
        });
        queryParts.push({ branch: { $in: regexBranches } });
      }
    }

    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\\]\\]/g, String.raw`\\$&`);
      const regex = new RegExp(escaped, 'i');
      queryParts.push({ $or: [{ name: regex }, { rollNumber: regex }, { email: regex }] });
    }

    if (minCgpaNum !== null) {
      queryParts.push({ cgpa: { $gte: minCgpaNum } });
    }

    if (minTwelfthNum !== null) {
      queryParts.push({
        $or: [
          { twelfthPercentage: { $gte: minTwelfthNum } },
          { twelfthPercent: { $gte: minTwelfthNum } },
          { twelfth: { $gte: minTwelfthNum } },
          { hscPercentage: { $gte: minTwelfthNum } },
          { twelftPercentage: { $gte: minTwelfthNum } },
          { twelft: { $gte: minTwelfthNum } },
        ],
      });
    }

    const query = queryParts.length > 0 ? { $and: queryParts } : {};

    const filteredProfiles = await StudentProfile.find(query).lean();
    const rollNumbers = filteredProfiles.map((profile) => profile.rollNumber).filter(Boolean);
    const students = await Student.find({ rollNumber: { $in: rollNumbers } }).lean();
    const studentByRoll = new Map(students.map((student) => [student.rollNumber, student]));

    const parseNumericValue = (value) => {
      if (value === undefined || value === null || String(value).trim() === '') return null;
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    };

    const results = filteredProfiles.map((profile) => {
      const student = studentByRoll.get(profile.rollNumber) || {};
      const twelfthKeys = ['twelfthPercentage', 'twelfthPercent', 'twelfth', 'twelftPercentage', 'twelft', 'hscPercentage'];
      let rawTwelfth = null;
      for (const k of twelfthKeys) {
        if (profile[k] !== undefined && profile[k] !== null) {
          rawTwelfth = profile[k];
          break;
        }
        if (student[k] !== undefined && student[k] !== null) {
          rawTwelfth = student[k];
          break;
        }
      }

      let rawCgpa = null;
      if (profile.cgpa !== undefined && profile.cgpa !== null) {
        rawCgpa = profile.cgpa;
      } else if (student.cgpa !== undefined && student.cgpa !== null) {
        rawCgpa = student.cgpa;
      }

      const resolvedCgpa = parseNumericValue(rawCgpa);
      const resolvedTwelfth = parseNumericValue(rawTwelfth);
      const resolvedBranch = profile.branch || student.branch || '';
      const profileEmail = String(profile.email || '').trim().toLowerCase();
      const studentEmail = String(student.email || '').trim().toLowerCase();
      const profileName = String(profile.name || '').trim().toLowerCase();
      const studentName = String(student.fullName || '').trim().toLowerCase();
      const profileMatchesStudent =
        (!profileEmail || !studentEmail || profileEmail === studentEmail) &&
        (!profileName || !studentName || profileName === studentName);

      return {
        ...profile,
        name: student.fullName || profile.name || '',
        email: student.email || profile.email || '',
        profileMatchesStudent,
        branch: resolvedBranch,
        twelfthPercentage: resolvedTwelfth,
        cgpa: resolvedCgpa,
      };
    }).filter((profile) => {
      if (minCgpaNum !== null) {
        if (profile.cgpa === null || profile.cgpa < minCgpaNum) {
          return false;
        }
      }

      if (minTwelfthNum !== null) {
        if (profile.twelfthPercentage === null || profile.twelfthPercentage < minTwelfthNum) {
          return false;
        }
      }

      return true;
    });

    res.json(results);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.uploadDocument = async (req, res) => {
  try {
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

    const fileUrl = await uploadFileToStorage(req.file, documentType);

    switch (documentType) {
      case "resume":
        profile.resume = fileUrl;
        break;

      case "marksheet":
        profile.marksheet = fileUrl;
        break;

      case "tenthMarksheet":
        profile.tenthMarksheet = fileUrl;
        profile.marksheet = fileUrl;
        break;

      case "twelfthMarksheet":
        profile.twelfthMarksheet = fileUrl;
        profile.marksheet = fileUrl;
        break;

      case "semesterMarksheets":
        profile.semesterMarksheets = fileUrl;
        profile.marksheet = fileUrl;
        break;

      case "idProof":
        profile.governmentId = fileUrl;
        break;

      case "profilePhoto":
        if (!req.file.mimetype.startsWith("image/")) {
          return res.status(400).json({
            success: false,
            message: "Profile photo must be a JPG or PNG image",
          });
        }
        profile.profilePhoto = fileUrl;
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
      fileName: req.file.originalname,
      filePath: fileUrl,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
    });
  } catch (err) {
    console.error("Document upload failed:", err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/* OCR and extracted-document verification handlers were removed; uploaded files are reviewed manually by admins.
exports.parseResume = async (req, res) => {
  try {
    const { rollNumber, filePath, fileName } = req.body;
    if (!rollNumber) return res.status(400).json({ success: false, message: 'Roll number is required' });

    const profile = await StudentProfile.findOne({ rollNumber }).lean();
    const requestedPath = filePath || profile?.resume;
    if (!requestedPath) return res.status(400).json({ success: false, message: 'Upload a resume before reading it' });

    const uploadsRoot = path.resolve(__dirname, '..', 'uploads');
    const relativePath = String(requestedPath).replace(/^[/\\]+/, '');
    const absolutePath = path.resolve(__dirname, '..', relativePath);
    if (!absolutePath.startsWith(`${uploadsRoot}${path.sep}`)) {
      return res.status(400).json({ success: false, message: 'Invalid resume path' });
    }
    if (!fs.existsSync(absolutePath)) {
      return res.status(404).json({ success: false, message: 'Resume file was not found on the server' });
    }
    if (!/\.pdf$/i.test(fileName || absolutePath)) {
      return res.status(422).json({ success: false, message: 'Resume autofill currently supports PDF files with selectable text' });
    }

    const extractedFields = extractResumeFields(await readPdfText(absolutePath));
    return res.status(200).json({
      success: true,
      extractedFields,
      keywords: extractedFields.keywords,
    });
  } catch (err) {
    return res.status(422).json({ success: false, message: err.message || 'Could not read the resume' });
  }
};

exports.getDocumentAnalyses = async (req, res) => {
  try {
    const query = req.params.rollNumber ? { rollNumber: req.params.rollNumber } : {};
    const analyses = await DocumentAnalysis.find(query).sort({ createdAt: -1 });
    res.status(200).json({ success: true, analyses });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.verifyStudentDocument = async (req, res) => {
  try {
    const { rollNumber } = req.params;
    const { documentType, filePath, fileName } = req.body;
    if (!rollNumber) return res.status(400).json({ success: false, message: 'Roll number is required' });
    const supportedDocumentTypes = ['photo', 'idProof', 'tenthMarksheet', 'twelfthMarksheet', 'semesterMarksheets'];
    if (!supportedDocumentTypes.includes(documentType)) {
      return res.status(400).json({ success: false, message: 'Unsupported document type' });
    }

    const profile = await StudentProfile.findOne({ rollNumber }).lean();
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: `Student profile ${rollNumber} was not found. Refresh the profile and verify again.`,
      });
    }
    const requestedPath = filePath ||
      (documentType === 'tenthMarksheet' ? profile?.tenthMarksheet :
      documentType === 'twelfthMarksheet' ? profile?.twelfthMarksheet :
      documentType === 'semesterMarksheets' ? profile?.semesterMarksheets :
      profile?.marksheet);
    if (!requestedPath) return res.status(400).json({ success: false, message: 'Upload this document before verifying it' });

    const uploadsRoot = path.resolve(__dirname, '..', 'uploads');
    const relativePath = String(requestedPath).replace(/^[/\\]+/, '');
    const absolutePath = path.resolve(__dirname, '..', relativePath);
    if (!absolutePath.startsWith(`${uploadsRoot}${path.sep}`)) {
      return res.status(400).json({ success: false, message: 'Invalid document path' });
    }
    if (!fs.existsSync(absolutePath)) {
      return res.status(404).json({ success: false, message: 'Document file was not found on the server' });
    }
    if (!['tenthMarksheet', 'twelfthMarksheet', 'semesterMarksheets'].includes(documentType)) {
      return res.status(200).json({
        success: true,
        verified: true,
        message: `${fileName || 'Document'} verified successfully`,
      });
    }
    if (!/\.pdf$/i.test(fileName || absolutePath)) {
      return res.status(422).json({ success: false, message: 'Marksheet verification supports PDF files' });
    }

    const extractedFields = extractResumeFields(await readPdfText(absolutePath));
    const label = documentType === 'tenthMarksheet'
      ? '10th'
      : documentType === 'twelfthMarksheet' ? '12th' : 'latest semester';
    const fields = documentType === 'tenthMarksheet'
      ? [{ key: 'tenthPercentage', label: '10th percentage' }]
      : documentType === 'twelfthMarksheet'
        ? [{ key: 'twelfthPercentage', label: '12th percentage' }]
        : [{ key: 'cgpa', label: 'current CGPA' }, { key: 'graduationMarks', label: 'graduation percentage' }];
    const fieldScores = {};
    fields.forEach(({ key, label: fieldLabel }) => {
      const expected = Number(profile?.[key]);
      const extracted = Number(extractedFields[key]);
      const difference = Number.isFinite(expected) && Number.isFinite(extracted) ? Math.abs(expected - extracted) : null;
      const score = difference === null ? 0 : Math.max(0, Math.round(100 - (difference * 100)));
      fieldScores[key] = {
        label: fieldLabel,
        expected: Number.isFinite(expected) ? expected : null,
        extracted: Number.isFinite(extracted) ? extracted : null,
        difference,
        score,
        matched: difference !== null && difference <= 0.5,
      };
    });
    const scoredFields = Object.values(fieldScores);
    const hasReadableFields = scoredFields.some((field) => Number.isFinite(field.extracted));
    const verificationScore = hasReadableFields
      ? Math.round(scoredFields.reduce((total, field) => total + field.score, 0) / scoredFields.length)
      : null;
    const matched = hasReadableFields && scoredFields.every((field) => field.matched);
    const primaryField = fieldScores[fields[0].key];
    const comparison = scoredFields.map((field) => `${field.label}: profile ${field.expected ?? 'not entered'}; uploaded ${field.extracted ?? 'not detected'}`).join(' | ');

    const noReadableDataMessage = 'No readable academic data was found in this marksheet. Upload a clearer PDF or a text-based marksheet for verification.';

    return res.status(200).json({
      success: true,
      verified: matched,
      message: matched
        ? `${label} marksheet verified successfully. ${comparison}`
        : verificationScore === null
          ? `${label} marksheet could not be verified. ${noReadableDataMessage}`
          : `${label} marksheet scored ${verificationScore}/100. ${comparison}`,
      expected: primaryField.expected,
      extracted: primaryField.extracted,
      difference: primaryField.difference,
      verificationScore,
      fieldScores,
    });
  } catch (err) {
    const message = err.message === 'No readable text was found in this document'
      ? 'No readable text was found in this marksheet, including OCR. Check that the scan is clear and the score is visible.'
      : err.message || 'Could not verify the document';
    return res.status(422).json({ success: false, message });
  }
};

exports.verifyDocuments = async (req, res) => {
  try {
    const { rollNumber } = req.params;
    if (!rollNumber) {
      return res.status(400).json({ success: false, message: 'Roll number is required' });
    }

    const profile = await StudentProfile.findOne({ rollNumber }).lean();
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Student profile not found' });
    }

    const analyses = await DocumentAnalysis.find({ rollNumber }).sort({ createdAt: -1 }).lean();
    const latestDocuments = {};
    analyses.forEach((analysis) => {
      if (!latestDocuments[analysis.documentType]) latestDocuments[analysis.documentType] = analysis;
    });

    const result = buildDocumentVerification({
      profile,
      documents: {
        resume: profile.resume || latestDocuments.resume,
        marksheet: profile.marksheet || latestDocuments.marksheet,
        certificate: latestDocuments.certificate,
        documentType: latestDocuments.marksheet?.documentType || latestDocuments.certificate?.documentType,
      },
      analyses,
      company: req.body?.company || null,
    });

    await DocumentAnalysis.updateMany(
      { rollNumber },
      {
        $set: {
          pipelineStatus: 'Verification pending',
          verificationChecks: result.checks,
              riskAssessment: result.riskAssessment,
              verificationDecision: result.riskAssessment.recommendedAction,
          'extractedJson.fields': result.extractedFields,
        },
      }
    );

    return res.status(200).json({
      success: true,
      message: 'Documents verified against the student profile',
      verification: result,
      verificationRisk: result.riskAssessment,
      suggestedProfile: result.extractedFields,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

*/

exports.sendProfileForVerification = async (req, res) => {
  try {
    const {
      rollNumber,
      name,
      email,
      phone,
      address,
      branch,
      skills,
      certifications,
      projects,
      linkedin,
      github,
      portfolio,
      profilePhoto,
      cgpa,
      tenthPercentage,
      twelfthPercentage,
      graduationYear,
      backlogs,
      diplomaPercentage,
      graduationMarks,
      documents,
      submittedAt,
    } = req.body;

    if (!rollNumber) {
      return res.status(400).json({ success: false, message: "Roll number is required" });
    }

    const existingProfile = await StudentProfile.findOne({ rollNumber }).lean();

    const resolvedProfilePhoto = existingProfile?.profilePhoto || profilePhoto || documents?.profilePhoto?.url || documents?.profilePhoto?.filePath || documents?.profilePhoto?.filepath || '';

    const resolvedDocuments = {};
    const documentTypes = ['resume', 'marksheet', 'tenthMarksheet', 'twelfthMarksheet', 'semesterMarksheets', 'idProof'];
    documentTypes.forEach((documentType) => {
      const submittedDocument = documents?.[documentType];
      if (!submittedDocument) return;
      const documentValue = typeof submittedDocument === 'string'
        ? { url: submittedDocument }
        : submittedDocument;
      resolvedDocuments[documentType] = {
        fileName: documentValue.fileName || documentValue.name,
        filePath: documentValue.filePath || documentValue.filepath,
        url: documentValue.url || documentValue.filePath || documentValue.filepath,
        uploadedOn: documentValue.uploadedOn || documentValue.uploadedAt,
      };
    });
    const docMap = {
      resume: existingProfile?.resume || documents?.resume?.url || documents?.resume?.filePath || documents?.resume?.filepath,
      marksheet: existingProfile?.marksheet || documents?.marksheet?.url || documents?.marksheet?.filePath || documents?.marksheet?.filepath,
      idProof: existingProfile?.governmentId || documents?.idProof?.url || documents?.idProof?.filePath || documents?.idProof?.filepath,
    };

    if (docMap.resume) resolvedDocuments.resume = { ...resolvedDocuments.resume, url: docMap.resume };
    if (docMap.marksheet) resolvedDocuments.marksheet = { ...resolvedDocuments.marksheet, url: docMap.marksheet };
    if (docMap.idProof) resolvedDocuments.idProof = { ...resolvedDocuments.idProof, url: docMap.idProof };

    if (resolvedDocuments.resume && !resolvedDocuments.resume.fileName && typeof resolvedDocuments.resume.url === 'string') {
      resolvedDocuments.resume.fileName = resolvedDocuments.resume.url.split('/').pop();
    }
    if (resolvedDocuments.marksheet && !resolvedDocuments.marksheet.fileName && typeof resolvedDocuments.marksheet.url === 'string') {
      resolvedDocuments.marksheet.fileName = resolvedDocuments.marksheet.url.split('/').pop();
    }
    if (resolvedDocuments.idProof && !resolvedDocuments.idProof.fileName && typeof resolvedDocuments.idProof.url === 'string') {
      resolvedDocuments.idProof.fileName = resolvedDocuments.idProof.url.split('/').pop();
    }

    const submittedDate = submittedAt ? new Date(submittedAt) : new Date();
    const verificationData = {
      rollNumber,
      name,
      email,
      phone,
      address,
      branch,
      skills,
      certifications,
      projects,
      linkedin,
      github,
      portfolio,
      profilePhoto: resolvedProfilePhoto,
      cgpa: normalizeNumberField(cgpa),
      tenthPercentage: normalizeNumberField(tenthPercentage),
      twelfthPercentage: normalizeNumberField(twelfthPercentage),
      diplomaPercentage: normalizeNumberField(diplomaPercentage),
      graduationMarks: normalizeNumberField(graduationMarks),
      graduationYear,
      backlogs: normalizeNumberField(backlogs),
      documents: resolvedDocuments,
      verificationStatus: 'Pending',
      verificationNote: 'Awaiting manual admin review',
      submittedAt: Number.isNaN(submittedDate.getTime()) ? new Date() : submittedDate,
    };
    const latestVerification = await ProfileVerification.findOne({ rollNumber })
      .sort({ submittedAt: -1, createdAt: -1 });
    const verification = latestVerification
      ? await ProfileVerification.findByIdAndUpdate(latestVerification._id, verificationData, { new: true, runValidators: true })
      : await ProfileVerification.create(verificationData);

    await ProfileVerification.deleteMany({
      rollNumber,
      _id: { $ne: verification._id },
    });

    res.status(201).json({
      success: true,
      message: "Profile sent for verification successfully",
      verification,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.getProfileVerificationStatus = async (req, res) => {
  try {
    const { rollNumber } = req.params;

    if (!rollNumber) {
      return res.status(400).json({ success: false, message: "Roll number is required" });
    }

    const verification = await ProfileVerification.findOne({
      rollNumber,
      verificationStatus: 'Verified',
    }).sort({ updatedAt: -1, createdAt: -1 }) || await ProfileVerification.findOne({ rollNumber })
      .sort({ updatedAt: -1, createdAt: -1 });

    if (!verification) {
      return res.status(200).json({
        success: true,
        status: 'Not Sent',
        verification: null,
      });
    }

    const profile = await StudentProfile.findOne({ rollNumber }).lean();
    const status = profile?.verificationStatus || verification.verificationStatus;
    const note = profile?.verificationNote || verification.verificationNote || '';

    res.status(200).json({
      success: true,
      status,
      verification: { ...verification, verificationStatus: status, verificationNote: note },
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.getAllProfileVerifications = async (req, res) => {
  try {
    const { status, branch, search, minCgpa, minTwelfthPercentage } = req.query;

    let query = {};

    const parseNumber = (value) => {
      if (value === undefined || value === null || String(value).trim() === '') return null;
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    };

    if (status && status !== 'All') {
      query.verificationStatus = status;
    }

    if (branch && branch !== '') {
      query.branch = branch;
    }

    if (search && search !== '') {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { rollNumber: searchRegex },
        { name: searchRegex },
        { email: searchRegex },
      ];
    }

    const minCgpaValue = parseNumber(minCgpa);
    if (minCgpaValue !== null) query.cgpa = { $gte: minCgpaValue };

    const minTwelfthValue = parseNumber(minTwelfthPercentage);
    if (minTwelfthValue !== null) query.twelfthPercentage = { $gte: minTwelfthValue };

    const verifications = await ProfileVerification.find(query)
      .sort({ updatedAt: -1, createdAt: -1 });

    const uniqueVerifications = [];
    const seenRollNumbers = new Set();
    verifications.forEach((verification) => {
      if (seenRollNumbers.has(verification.rollNumber)) return;
      seenRollNumbers.add(verification.rollNumber);
      uniqueVerifications.push(verification);
    });

    const selectedRollNumbers = new Set(
      await Application.distinct('studentId', { status: /^Selected$/i })
    );
    const availableVerifications = uniqueVerifications.filter(
      (verification) => !selectedRollNumbers.has(verification.rollNumber)
    );

    res.status(200).json({
      success: true,
      verifications: availableVerifications,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.updateProfileVerificationStatus = async (req, res) => {
  try {
    const { verificationId } = req.params;
    const { verificationStatus, verificationNote, verifiedBy } = req.body;

    if (!verificationId) {
      return res.status(400).json({ success: false, message: "Verification ID is required" });
    }

    if (!['Pending', 'Verified', 'Rejected'].includes(verificationStatus)) {
      return res.status(400).json({ success: false, message: "Invalid verification status" });
    }

    const verification = await ProfileVerification.findByIdAndUpdate(
      verificationId,
      {
        verificationStatus,
        verificationNote,
        verifiedBy,
        verificationDate: new Date(),
      },
      { returnDocument: 'after' }
    );

    if (!verification) {
      return res.status(404).json({ success: false, message: "Verification record not found" });
    }

    // A student may have submitted more than once. Keep every submission for
    // that student consistent so the student dashboard cannot show an older
    // Pending record after the admin verifies one submission.
    await ProfileVerification.updateMany(
      { rollNumber: verification.rollNumber },
      {
        $set: {
          verificationStatus,
          verificationNote,
          verifiedBy,
          verificationDate: verification.verificationDate,
        },
      }
    );

    await StudentProfile.findOneAndUpdate(
      { rollNumber: verification.rollNumber },
      {
        $set: {
          verificationStatus,
          verificationNote,
        },
      },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
    );

    if (verificationStatus === 'Verified') {
      const profileUpdate = {
        name: verification.name,
        email: verification.email,
        phone: verification.phone,
        address: verification.address,
        branch: verification.branch,
        skills: verification.skills,
        certifications: verification.certifications,
        projects: verification.projects,
        linkedin: verification.linkedin,
        github: verification.github,
        portfolio: verification.portfolio,
        cgpa: verification.cgpa,
        graduationYear: verification.graduationYear,
        backlogs: verification.backlogs,
        diplomaPercentage: verification.diplomaPercentage,
        graduationMarks: verification.graduationMarks,
        tenthPercentage: verification.tenthPercentage,
        twelfthPercentage: verification.twelfthPercentage,
      };

      const docs = verification.documents || {};
      const documentUrl = (document) => document?.url || document?.filePath || document?.filepath || document?.path;
      if (documentUrl(docs.resume)) profileUpdate.resume = documentUrl(docs.resume);
      if (documentUrl(docs.marksheet)) profileUpdate.marksheet = documentUrl(docs.marksheet);
      if (documentUrl(docs.idProof)) profileUpdate.governmentId = documentUrl(docs.idProof);

      await StudentProfile.findOneAndUpdate(
        { rollNumber: verification.rollNumber },
        { $set: profileUpdate },
        { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
      );

      if (verification.rollNumber) {
        try {
          await Student.findOneAndUpdate(
            { rollNumber: verification.rollNumber },
            {
              $set: {
                fullName: verification.name || 'Unknown Student',
                email: verification.email || '',
                phone: verification.phone || '',
                branch: verification.branch || '',
                rollNumber: verification.rollNumber,
              },
            },
            { upsert: true, returnDocument: 'after' }
          );
        } catch (studentSyncError) {
          // StudentProfile is the source used by the CGPA filter. Do not
          // turn a successful profile verification into a failed response
          // if the separate login record cannot be synchronized.
          console.warn('Could not sync verified student login record:', studentSyncError.message);
        }

        try {
          await Notification.create({
            studentId: verification.rollNumber,
            studentName: verification.name || verification.rollNumber,
            companyName: 'Placement Office',
            message: 'Your profile has been verified by the placement office. You can now apply to eligible placement drives.',
            type: 'Info',
          });
        } catch (notificationError) {
          console.warn('Could not create profile verification notification:', notificationError.message);
        }
      }
    }

    res.status(200).json({
      success: true,
      message: `Profile ${verificationStatus.toLowerCase()} successfully`,
      verification,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};