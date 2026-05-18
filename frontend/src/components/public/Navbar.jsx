import { useState } from "react";
import { NavLink, Link, useNavigate, useLocation } from "react-router-dom";
import "../../styles/admin.css";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const isHome = location.pathname === "/";

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showLogoutSuccess, setShowLogoutSuccess] = useState(false);

  const savedUser = localStorage.getItem("user");
  let user = null;

  try {
    user = savedUser ? JSON.parse(savedUser) : null;
  } catch (error) {
    console.error("Invalid user data in localStorage:", error);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    user = null;
  }

  const handleHomeClick = (e) => {
    e.preventDefault();

    if (isHome) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      navigate("/");
    }
  };

  const handleDashboardClick = () => {
    if (!user) {
      navigate("/login");
      return;
    }

    if (user.role === "admin") {
      navigate("/admin/dashboard");
    } else if (user.role === "pet_owner") {
      navigate("/petowner/dashboard");
    } else {
      navigate("/");
    }
  };

  const openLogoutModal = () => {
    setShowLogoutModal(true);
  };

  const closeLogoutModal = () => {
    setShowLogoutModal(false);
  };

  const handleLogoutConfirm = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setShowLogoutModal(false);
    setShowLogoutSuccess(true);

    navigate("/", { replace: true });

    setTimeout(() => {
      setShowLogoutSuccess(false);
    }, 1600);
  };

  const dashboardLabel =
    user?.role === "admin" ? "Admin Dashboard" : "My Dashboard";

  return (
    <>
      <header className="public-top-navbar">
        <div className="public-navbar-left">
          <Link to="/" className="brand-area brand-link" onClick={handleHomeClick}>
            <div className="brand-logo">🐾</div>

            <h1 className="brand-name">
              Paw<span>Guard</span>
            </h1>
          </Link>
        </div>

        <nav className="public-nav-links">
          <a
            href="/"
            className={isHome ? "active" : ""}
            onClick={handleHomeClick}
          >
            Home
          </a>

          <NavLink to="/emergency-search">Guides</NavLink>
          <NavLink to="/quiz">Quizzes</NavLink>
          <NavLink to="/feedback">Feedback</NavLink>
          <NavLink to="/about">About</NavLink>
        </nav>

        <div className="public-navbar-right">
          {user ? (
            <>
              <button
                type="button"
                className="public-login-btn"
                onClick={handleDashboardClick}
              >
                {dashboardLabel}
              </button>

              <button
                type="button"
                className="public-logout-btn"
                onClick={openLogoutModal}
              >
                Log out
              </button>
            </>
          ) : (
            <NavLink to="/login" className="public-login-btn">
              Login
            </NavLink>
          )}
        </div>
      </header>

      {showLogoutModal && (
        <div className="public-logout-modal-overlay">
          <div className="public-logout-modal">
            <div className="public-logout-modal-icon">🚪</div>

            <h2>Log out?</h2>

            <p>
              You will be signed out from your PawGuard account. You can log in
              again anytime using your email and password.
            </p>

            <div className="public-logout-modal-actions">
              <button
                type="button"
                className="public-logout-cancel-btn"
                onClick={closeLogoutModal}
              >
                Cancel
              </button>

              <button
                type="button"
                className="public-logout-confirm-btn"
                onClick={handleLogoutConfirm}
              >
                Yes, log out
              </button>
            </div>
          </div>
        </div>
      )}

      {showLogoutSuccess && (
        <div className="public-logout-success">
          <div className="public-logout-success-icon">✓</div>
          <div>
            <strong>Logged out successfully</strong>
            <p>You have returned to the home page.</p>
          </div>
        </div>
      )}
    </>
  );
}