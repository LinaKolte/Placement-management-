const express = require("express");
const dotenv = require("dotenv");
const path = require("path");

const connectDB = require("./config/db");
const { processDeadlineReminders } = require("./utils/deadlineReminder");

dotenv.config({ path: path.join(__dirname, ".env") });

const app = express();
let dbConnectionPromise;

const ensureDatabaseConnection = () => {
  if (!dbConnectionPromise) {
    dbConnectionPromise = connectDB()
      .then((connected) => {
        if (!connected) dbConnectionPromise = null;
        return connected;
      })
      .catch((error) => {
        dbConnectionPromise = null;
        throw error;
      });
  }
  return dbConnectionPromise;
};

app.use(express.json());

if (process.env.NODE_ENV !== "production") {
  app.use("/uploads", express.static(path.join(__dirname, "uploads")));
}

app.get("/api/health", (req, res) => {
  res.status(200).json({ success: true });
});

app.use("/api", async (req, res, next) => {
  try {
    const connected = await ensureDatabaseConnection();
    if (!connected) {
      return res.status(503).json({ success: false, message: "Database connection unavailable" });
    }
    return next();
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    return res.status(503).json({ success: false, message: "Database connection unavailable" });
  }
});

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/student", require("./routes/StudentRoutes"));
app.use("/api/apply", require("./routes/Applicationroutes"));
app.use("/api/companies", require("./routes/CompanyRoutes"));
app.use("/api/assistant", require("./routes/assistantRoutes"));

app.get("/api/cron/deadline-reminders", async (req, res) => {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return res.status(503).json({ success: false, message: "CRON_SECRET is not configured" });
  }
  if (req.get("authorization") !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  try {
    await processDeadlineReminders();
    return res.status(200).json({ success: true, message: "Deadline reminders processed" });
  } catch (error) {
    console.error("Deadline reminder run failed:", error.message);
    return res.status(500).json({ success: false, message: "Deadline reminders could not be processed" });
  }
});

app.get("/", (req, res) => {
  res.send("Student Placement Portal Backend Running");
});

if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;