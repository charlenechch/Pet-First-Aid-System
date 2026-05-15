import { useEffect } from "react";
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
import Feedback from "./pages/public/Feedback";
import Quiz from "./pages/public/Quiz";

// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import ManagePetEmergency from "./pages/admin/ManagePetEmergency";
import ManageGuideContent from "./pages/admin/ManageGuideContent";
import ManageQuiz from "./pages/admin/ManageQuiz";
import ManageFeedback from "./pages/admin/ManageFeedback";
import ManageUsers from "./pages/admin/ManageUsers";
import AdminProfile from "./pages/admin/AdminProfile";

function App() {
  const location = useLocation();

  const isAdminRoute = location.pathname.startsWith("/admin");

  const hideFooterRoutes = ["/login", "/register", "/forgot-password"];
  const hideFooter = hideFooterRoutes.includes(location.pathname) || isAdminRoute;

  return (
    <>
      <ScrollToTop />

      {/* Show public Navbar only for public/customer pages */}
      {!isAdminRoute && <Navbar />}

      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />

        <Route path="/emergency-search" element={<EmergencySearch />} />
        <Route path="/topics" element={<EmergencySearch />} />

        <Route path="/guide-details/:id" element={<GuideDetails />} />

        <Route path="/feedback" element={<Feedback />} />
        <Route path="/quiz" element={<Quiz />} />

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Admin routes */}
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

        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Hide footer on admin and auth pages */}
      {!hideFooter && <Footer />}
    </>
  );
}

export default App;