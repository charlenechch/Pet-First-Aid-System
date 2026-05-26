import { Navigate, Route, Routes, useLocation } from "react-router-dom";

// Public components
import Navbar from "./components/public/Navbar";
import Footer from "./components/public/Footer";
import ScrollToTop from "./components/public/ScrollToTop";

// Admin layout
import AdminLayout from "./layouts/AdminLayout";

// Public pages
import Home from "./pages/public/Home";
import About from "./pages/public/About";
import EmergencySearch from "./pages/public/EmergencySearch";
import GuideDetails from "./pages/public/GuideDetails";
import Login from "./pages/public/Login";
import Register from "./pages/public/Register";
import ForgotPassword from "./pages/public/ForgotPassword";
import PublicFeedback from "./pages/public/Feedback";
import Quiz from "./pages/public/Quiz";

// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import ManagePetEmergency from "./pages/admin/ManagePetEmergency";
import ManageGuideContent from "./pages/admin/ManageGuideContent";
import ManageQuiz from "./pages/admin/ManageQuiz";
import ManageFeedback from "./pages/admin/ManageFeedback";
import ManageUsers from "./pages/admin/ManageUsers";
import AdminProfile from "./pages/admin/AdminProfile";

// Pet Owner pages
import PetOwnerLayout from "./layouts/PetOwnerLayout";
import PetOwnerDashboard from "./pages/petowner/PetOwnerDashboard";
import Profile from "./pages/petowner/Profile";
import Bookmark from "./pages/petowner/Bookmark";
import QuizList from "./pages/petowner/QuizList";
import QuizAttempt from "./pages/petowner/QuizAttempt";
import QuizResult from "./pages/petowner/QuizResult";
import PetOwnerFeedback from "./pages/petowner/Feedback";

function App() {
  const location = useLocation();

  const isAdminRoute = location.pathname.startsWith("/admin");
  const isPetOwnerRoute = location.pathname.startsWith("/petowner");

  const hideFooterRoutes = ["/login", "/register", "/forgot-password"];

  const hideFooter =
    hideFooterRoutes.includes(location.pathname) ||
    isAdminRoute ||
    isPetOwnerRoute;

  return (
    <>
      <ScrollToTop />

      {/* Show public Navbar only for public pages */}
      {!isAdminRoute && !isPetOwnerRoute && <Navbar />}

      <Routes>
        {/* ================= PUBLIC ROUTES ================= */}
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />

        {/* 7.1 and 7.2: Search, filter, bookmark emergency topics */}
        <Route path="/emergency-search" element={<EmergencySearch />} />
        <Route path="/topics" element={<EmergencySearch />} />

        {/* Emergency topic details */}
        <Route path="/guide-details/:id" element={<GuideDetails />} />

        <Route path="/feedback" element={<PublicFeedback />} />
        <Route path="/quiz" element={<Quiz />} />

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* ================= ADMIN ROUTES ================= */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="pet-topics" element={<ManagePetEmergency />} />
          <Route path="guide-content" element={<ManageGuideContent />} />
          <Route path="quizzes" element={<ManageQuiz />} />
          <Route path="feedback" element={<ManageFeedback />} />
          <Route path="users" element={<ManageUsers />} />
          <Route path="profile" element={<AdminProfile />} />
        </Route>

        {/* ================= PET OWNER ROUTES ================= */}
        <Route path="/petowner" element={<PetOwnerLayout />}>
          <Route index element={<Navigate to="/petowner/dashboard" replace />} />
          <Route path="dashboard" element={<PetOwnerDashboard />} />
          <Route path="profile" element={<Profile />} />

          {/* Pet owner can also access emergency search inside layout */}
          <Route path="emergency-search" element={<EmergencySearch />} />

          {/* 7.1: Pet owner bookmarks emergency topic */}
          <Route path="bookmarks" element={<Bookmark />} />

          {/* 7.4: Pet owner attempts quiz and views result */}
          <Route path="quizzes" element={<QuizList />} />
          <Route path="quizzes/:quizId/attempt" element={<QuizAttempt />} />
          <Route path="quizzes/:quizId/result" element={<QuizResult />} />

          <Route path="feedback" element={<PetOwnerFeedback />} />
        </Route>

        {/* ================= FALLBACK ROUTE ================= */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Hide footer on admin, pet owner and auth pages */}
      {!hideFooter && <Footer />}
    </>
  );
}

export default App;