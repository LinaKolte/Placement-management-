import { BrowserRouter, Routes, Route } from "react-router-dom";
import Register from "./pages/Register";
import StudentDashboard from "./pages/Student";
import Admin from "./pages/Admin";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Register />} />
        <Route path="/student" element={<StudentDashboard />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;