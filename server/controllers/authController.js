const Student = require("../models/student");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const crypto = require("node:crypto");
const nodemailer = require("nodemailer");
const AdminAccount = require("../models/AdminAccount");

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const getBootstrapAdminEmail = () =>
  String(process.env.ADMIN_EMAIL || "admin@campus.edu").trim().toLowerCase();

exports.register = async (req, res) => {
  try {
    const { fullName, email, password, phone = "", rollNumber = "", branch = "" } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required",
      });
    }

    const exist = await Student.findOne({ email: email.toLowerCase() });

    if (exist) {
      return res.status(400).json({
        success: false,
        message: "Email already exists",
      });
    }

    const hashPassword = await bcrypt.hash(password, 10);

    const student = await Student.create({
      fullName,
      email: email.toLowerCase(),
      phone,
      password: hashPassword,
      rollNumber,
      branch,
    });

    res.status(201).json({
      success: true,
      message: "Registration Successful",
      student,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    if (role === "admin") {
      const adminAccount = await AdminAccount.findOne();
      const adminEmail = adminAccount?.passwordHash ? adminAccount.email : getBootstrapAdminEmail();
      const validPassword = adminAccount?.passwordHash
        ? await bcrypt.compare(password, adminAccount.passwordHash)
        : password === (process.env.ADMIN_PASSWORD || "admin123");

      if (normalizedEmail !== adminEmail.toLowerCase() || !validPassword) {
        return res.status(401).json({
          success: false,
          message: "Invalid admin credentials",
        });
      }

      const token = jwt.sign(
        { id: "admin", email: adminEmail, role: "admin" },
        process.env.JWT_SECRET || "placement-secret",
        { expiresIn: "7d" }
      );

      return res.status(200).json({
        success: true,
        message: "Admin login successful",
        token,
        user: {
          id: "admin",
          name: "Placement Office",
          email: adminEmail,
          role: "admin",
        },
        student: {
          id: "admin",
          name: "Placement Office",
          email: adminEmail,
          role: "admin",
        },
      });
    }

    const student = await Student.findOne({ email: normalizedEmail });

    if (!student) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, student.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const token = jwt.sign(
      { id: student._id, email: student.email, role: "student" },
      process.env.JWT_SECRET || "placement-secret",
      { expiresIn: "7d" }
    );

    res.status(200).json({
      success: true,
      message: "Login Successful",
      token,
      user: {
        id: student._id,
        name: student.fullName,
        email: student.email,
        role: "student",
      },
      student: {
        id: student._id,
        fullName: student.fullName,
        email: student.email,
        rollNumber: student.rollNumber,
        branch: student.branch,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.requestAdminPasswordReset = async (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    if (!email) {
      return res.status(400).json({ success: false, message: "Admin email is required" });
    }

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      return res.status(503).json({ success: false, message: "Email delivery is not configured" });
    }

    const recoveryEmail = String(process.env.ADMIN_RECOVERY_EMAIL || process.env.EMAIL_USER).trim().toLowerCase();
    const adminAccount = await AdminAccount.findOne();
    const configuredEmail = adminAccount?.passwordHash ? adminAccount.email : getBootstrapAdminEmail();
    if (email === configuredEmail) {
      const code = crypto.randomInt(0, 1000000).toString().padStart(6, "0");
      const account = adminAccount || new AdminAccount({ email: configuredEmail });
      account.email = configuredEmail;
      account.resetCodeHash = crypto.createHash("sha256").update(code).digest("hex");
      account.resetCodeExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
      account.resetCodeAttempts = 0;
      await account.save();

      const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
      });
      await transporter.sendMail({
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to: recoveryEmail,
        subject: "Admin account reset code",
        text: `Your admin account reset code is ${code}. It expires in 10 minutes. If you did not request this, ignore this email.`,
      });
    }

    return res.status(200).json({
      success: true,
      message: "If the email belongs to the admin account, a reset code has been sent.",
    });
  } catch (error) {
    console.error("Admin reset code request failed:", error.message);
    return res.status(500).json({ success: false, message: "Could not send the reset code" });
  }
};

exports.confirmAdminPasswordReset = async (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const code = String(req.body.code || "").trim();
    const newEmail = String(req.body.newEmail || "").trim().toLowerCase();
    const newPassword = String(req.body.newPassword || "");

    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(newEmail) || !/^\d{6}$/.test(code) || newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Enter the 6-digit code, a valid new email, and a password with at least 8 characters",
      });
    }

    const account = await AdminAccount.findOne({ email });
    const submittedHash = crypto.createHash("sha256").update(code).digest("hex");
    const hashMatches = account?.resetCodeHash &&
      crypto.timingSafeEqual(Buffer.from(submittedHash), Buffer.from(account.resetCodeHash));

    if (!account?.resetCodeHash || !account.resetCodeExpiresAt || account.resetCodeExpiresAt <= new Date() || account.resetCodeAttempts >= 5 || !hashMatches) {
      if (account?.resetCodeHash && account.resetCodeAttempts < 5) {
        account.resetCodeAttempts += 1;
        if (account.resetCodeAttempts >= 5) {
          account.resetCodeHash = "";
          account.resetCodeExpiresAt = null;
        }
        await account.save();
      }
      return res.status(400).json({ success: false, message: "Reset code is invalid or expired" });
    }

    account.email = newEmail;
    account.passwordHash = await bcrypt.hash(newPassword, 12);
    account.resetCodeHash = "";
    account.resetCodeExpiresAt = null;
    account.resetCodeAttempts = 0;
    await account.save();

    return res.status(200).json({ success: true, message: "Admin email and password updated. Sign in with the new credentials." });
  } catch (error) {
    console.error("Admin password reset failed:", error.message);
    return res.status(500).json({ success: false, message: "Could not reset admin credentials" });
  }
};

exports.googleLogin = async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({
        success: false,
        message: "Google credential is required",
      });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    if (!payload?.email || !payload.email_verified) {
      return res.status(401).json({
        success: false,
        message: "Google account email could not be verified",
      });
    }

    const email = payload.email.toLowerCase();
    let student = await Student.findOne({ email });

    if (!student) {
      student = await Student.create({
        fullName: payload.name || email.split("@")[0],
        email,
        password: await bcrypt.hash(crypto.randomBytes(32).toString("hex"), 10),
      });
    }

    const token = jwt.sign(
      { id: student._id, email: student.email, role: "student" },
      process.env.JWT_SECRET || "placement-secret",
      { expiresIn: "7d" }
    );

    return res.status(200).json({
      success: true,
      message: "Google login successful",
      token,
      user: {
        id: student._id,
        name: student.fullName,
        email: student.email,
        role: "student",
      },
      student: {
        id: student._id,
        fullName: student.fullName,
        email: student.email,
        rollNumber: student.rollNumber,
        branch: student.branch,
      },
    });
  } catch (error) {
    console.error("Google login failed:", error.message);
    res.status(401).json({
      success: false,
      message: "Invalid Google credential",
    });
  }
};