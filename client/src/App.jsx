import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";
import Register from "./Pages/Register";
import StudentDashboard from "./Pages/Student";
import Admin from "./Pages/Admin";
import Notifications from "./Pages/Notifications";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Register />} />
        <Route path="/login" element={<Register />} />
        <Route path="/register" element={<Register />} />
        <Route path="/student/login" element={<Register />} />
        <Route path="/admin/login" element={<Register />} />
        <Route path="/student" element={<StudentDashboard />} />
        <Route path="/student-live" element={<StudentDashboard />} />
        <Route path="/student-profile" element={<StudentDashboard initialTab="profile" />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/notifications" element={<Notifications />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;