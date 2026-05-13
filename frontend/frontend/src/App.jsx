import { Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

import Home from "./pages/Home";
import About from "./pages/About";
import EmergencySearch from "./pages/EmergencySearch";
import GuideDetails from "./pages/GuideDetails";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import Feedback from "./pages/Feedback";
import Quiz from "./pages/Quiz";

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);

  return null;
}

export default function App() {
  const location = useLocation();

  const hideFooterRoutes = ["/login", "/register", "/forgot-password"];
  const hideFooter = hideFooterRoutes.includes(location.pathname);

  return (
    <>
      <ScrollToTop />

      <Navbar />

      <Routes>
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
      </Routes>

      {!hideFooter && <Footer />}
    </>
  );
}