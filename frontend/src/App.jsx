import { Navigate, Route, Routes } from "react-router-dom";
import AdminLayout from "./layouts/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import ManagePetEmergency from "./pages/admin/ManagePetEmergency";
import ManageGuideContent from "./pages/admin/ManageGuideContent";
import ManageQuiz from "./pages/admin/ManageQuiz";
import ManageFeedback from "./pages/admin/ManageFeedback";
import ManageUsers from "./pages/admin/ManageUsers";
import AdminProfile from "./pages/admin/AdminProfile";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/admin/dashboard" />} />

      <Route path="/admin" element={<AdminLayout />}>
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="pet-topics" element={<ManagePetEmergency />} />
        <Route path="guide-content" element={<ManageGuideContent />} />
        <Route path="quizzes" element={<ManageQuiz />} />
        <Route path="feedback" element={<ManageFeedback />} />
        <Route path="users" element={<ManageUsers />} />
        <Route path="profile" element={<AdminProfile />} />
      </Route>
    </Routes>
  );
}

export default App;