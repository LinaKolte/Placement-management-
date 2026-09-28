const path = require("node:path");
const dotenv = require("dotenv");
const mongoose = require("mongoose");

dotenv.config({ path: path.join(__dirname, ".env") });

const connectDB = require("./config/db");
const Company = require("./models/Company");
const StudentProfile = require("./models/StudentProfile");
const Application = require("./models/Application");

const companyData = {
  name: "TechNova Solutions",
  role: "Software Engineer",
  package: "10 LPA",
  minCgpa: 7,
  minTenthPercentage: 70,
  minTwelfthPercentage: 70,
  branches: ["CSE", "IT"],
  maxBacklogs: 0,
  noBacklogs: true,
  status: "Open",
  applicationStart: new Date("2026-09-01T09:00:00"),
  deadline: new Date("2026-10-15T17:00:00"),
};

function buildStudent(index) {
  const rollNumber = `26TN${String(index).padStart(3, "0")}`;
  return {
    rollNumber,
    name: `Demo Student ${index}`,
    email: `demo.student.${index}@example.com`,
    phone: `900000${String(index).padStart(4, "0")}`,
    branch: index % 3 === 0 ? "IT" : "CSE",
    cgpa: Number((7.2 + (index % 19) / 10).toFixed(2)),
    tenthPercentage: 75 + (index % 16),
    twelfthPercentage: 74 + (index % 17),
    backlogs: 0,
    graduationYear: "2026",
    verificationStatus: "Verified",
  };
}

async function seedDummyApplications() {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is not set in server/.env");
  }

  const connected = await connectDB();
  if (!connected) throw new Error("Could not connect to MongoDB");

  const company = await Company.findOneAndUpdate(
    { name: companyData.name, role: companyData.role },
    companyData,
    { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }
  );

  const students = Array.from({ length: 100 }, (_, offset) => buildStudent(offset + 1));
  await StudentProfile.bulkWrite(
    students.map((student) => ({
      updateOne: {
        filter: { rollNumber: student.rollNumber },
        update: { $set: student },
        upsert: true,
      },
    }))
  );

  await Application.bulkWrite(students.map((student) => ({
    updateOne: {
      filter: { studentId: student.rollNumber, companyId: String(company._id) },
      update: {
        $set: {
          studentId: student.rollNumber,
          companyId: String(company._id),
          companyName: company.name,
          deadline: company.deadline,
          package: company.package,
          status: "Applied",
          verificationStatus: "Verified",
          verificationNote: "Seeded demo application",
          verifiedBy: "Demo Seed",
          verificationUpdatedAt: new Date(),
        },
      },
      upsert: true,
    },
  })));

  const applicationCount = await Application.countDocuments({ companyId: String(company._id) });
  console.log(`Seeded ${applicationCount} applications for ${company.name} (${company.role}).`);
}

seedDummyApplications()
  .catch((error) => {
    console.error("Dummy data seed failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });