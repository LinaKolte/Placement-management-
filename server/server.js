const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const Student = require("./models/Student");

const connectDB = require("./config/db");

dotenv.config();

connectDB();

const app = express();

app.use(cors());
app.use(express.json());

// Make uploaded files accessible from the browser
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/student", require("./routes/StudentRoutes"));
app.use("/api/apply", require("./routes/Applicationroutes"));

app.get("/", (req, res) => {
  res.send("Student Placement Portal Backend Running");
});

app.get("/test", async (req, res) => {
  try {
    const student = new Student({
      fullName: "John Doe",
      email: "john@gmail.com",
      phone: "9876543210",
      password: "123456",
      rollNumber: "21CS001",
      branch: "CSE",
    });

    await student.save();

    res.send("Student inserted successfully");
  } catch (error) {
    console.log(error);
    res.status(500).send(error.message);
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});