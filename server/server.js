const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

const connectDB = require("./config/db");
const { processDeadlineReminders } = require("./utils/deadlineReminder");

// Load environment variables
dotenv.config({
  path: path.join(__dirname, ".env"),
});

const app = express();

/*
 * =========================
 * CORS CONFIGURATION
 * =========================
 */

const allowedOrigins = [
  "http://localhost:5173",
  "https://placement-management-zeta.vercel.app",
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests without an Origin header
    // (Postman, server-to-server requests, etc.)
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error("Not allowed by CORS"));
  },

  credentials: true,

  methods: [
    "GET",
    "POST",
    "PUT",
    "DELETE",
    "PATCH",
    "OPTIONS",
  ],

  allowedHeaders: [
    "Content-Type",
    "Authorization",
  ],

  optionsSuccessStatus: 204,
};

// CORS middleware
app.use(cors(corsOptions));

// Explicitly handle browser preflight requests
app.options("*", cors(corsOptions));

/*
 * =========================
 * MIDDLEWARE
 * =========================
 */

app.use(express.json());

/*
 * =========================
 * SERVE UPLOADS
 * =========================
 *
 * Serve uploads only during development.
 */

if (process.env.NODE_ENV !== "production") {
  app.use(
    "/uploads",
    express.static(path.join(__dirname, "uploads"))
  );
}

/*
 * =========================
 * DATABASE CONNECTION
 * =========================
 */

let dbConnectionPromise = null;

const ensureDatabaseConnection = () => {
  if (!dbConnectionPromise) {
    dbConnectionPromise = connectDB()
      .then((connected) => {
        if (!connected) {
          dbConnectionPromise = null;
        }

        return connected;
      })
      .catch((error) => {
        dbConnectionPromise = null;

        console.error(
          "MongoDB connection failed:",
          error.message
        );

        throw error;
      });
  }

  return dbConnectionPromise;
};

/*
 * =========================
 * HEALTH CHECK
 * =========================
 *
 * This does NOT require MongoDB.
 */

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Backend is running",
  });
});

/*
 * =========================
 * DATABASE MIDDLEWARE
 * =========================
 *
 * All other /api routes require
 * MongoDB connection.
 */

app.use("/api", async (req, res, next) => {
  try {
    const connected = await ensureDatabaseConnection();

    if (!connected) {
      return res.status(503).json({
        success: false,
        message: "Database connection unavailable",
      });
    }

    next();
  } catch (error) {
    console.error(
      "MongoDB connection failed:",
      error.message
    );

    return res.status(503).json({
      success: false,
      message: "Database connection unavailable",
    });
  }
});

/*
 * =========================
 * API ROUTES
 * =========================
 */

app.use(
  "/api/auth",
  require("./routes/authRoutes")
);

app.use(
  "/api/student",
  require("./routes/StudentRoutes")
);

app.use(
  "/api/apply",
  require("./routes/Applicationroutes")
);

app.use(
  "/api/companies",
  require("./routes/CompanyRoutes")
);

app.use(
  "/api/assistant",
  require("./routes/assistantRoutes")
);

/*
 * =========================
 * DEADLINE REMINDER CRON
 * =========================
 */

app.get(
  "/api/cron/deadline-reminders",
  async (req, res) => {
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      return res.status(503).json({
        success: false,
        message: "CRON_SECRET is not configured",
      });
    }

    if (
      req.get("authorization") !==
      `Bearer ${cronSecret}`
    ) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    try {
      await processDeadlineReminders();

      return res.status(200).json({
        success: true,
        message: "Deadline reminders processed",
      });
    } catch (error) {
      console.error(
        "Deadline reminder run failed:",
        error.message
      );

      return res.status(500).json({
        success: false,
        message:
          "Deadline reminders could not be processed",
      });
    }
  }
);

/*
 * =========================
 * ROOT ROUTE
 * =========================
 */

app.get("/", (req, res) => {
  res.send(
    "Student Placement Portal Backend Running"
  );
});

/*
 * =========================
 * START SERVER
 * =========================
 */

if (require.main === module) {
  const PORT = process.env.PORT || 5000;

  app.listen(PORT, () => {
    console.log(
      `Server running on port ${PORT}`
    );
  });
}

module.exports = app;