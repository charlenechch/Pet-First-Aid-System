import { Navigate, Route, Routes } from "react-router-dom";
import AdminLayout from "./layouts/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import ManagePetEmergency from "./pages/admin/ManagePetEmergency";
import ManageGuideContent from "./pages/admin/ManageGuideContent";
import ManageQuiz from "./pages/admin/ManageQuiz";
import ManageFeedback from "./pages/admin/ManageFeedback";
import ManageUsers from "./pages/admin/ManageUsers";
import AdminProfile from "./pages/admin/AdminProfile";
import PetOwnerLayout from "./layouts/PetOwnerLayout";
import PetOwnerDashboard from "./pages/petowner/PetOwnerDashboard";
import Profile from "./pages/petowner/Profile";
import Bookmark from "./pages/petowner/Bookmark";
import QuizList from "./pages/petowner/QuizList";
import QuizAttempt from "./pages/petowner/QuizAttempt";
import QuizResult from "./pages/petowner/QuizResult";
import Feedback from "./pages/petowner/Feedback";

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

      <Route path="/petowner" element={<PetOwnerLayout />}>
        <Route index element={<Navigate to="/petowner/dashboard" />} />
        <Route path="dashboard" element={<PetOwnerDashboard />} />
        <Route path="profile" element={<Profile />} />
        <Route path="bookmarks" element={<Bookmark />} />
        <Route path="quizzes" element={<QuizList />} />
        <Route path="quizzes/:quizId/attempt" element={<QuizAttempt />} />
        <Route path="quizzes/:quizId/result" element={<QuizResult />} />
        <Route path="feedback" element={<Feedback />} />
      </Route>
    </Routes>
  );
}

export default App;
