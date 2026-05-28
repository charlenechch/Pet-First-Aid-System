import { useState } from "react";
import { NavLink, Link, useNavigate, useLocation } from "react-router-dom";
import "../../styles/admin.css";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const isHome = location.pathname === "/";

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showLogoutSuccess, setShowLogoutSuccess] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

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

  const closeMobileMenu = () => {
    setShowMobileMenu(false);
  };

  const handleHomeClick = (e) => {
    e.preventDefault();
    closeMobileMenu();

    if (isHome) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      navigate("/");
    }
  };

  const handleDashboardClick = () => {
    closeMobileMenu();

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
    closeMobileMenu();
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
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "auto",
    });
  }, 0);

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
          <Link
            to="/"
            className="brand-area brand-link"
            onClick={handleHomeClick}
          >
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

        <button
          type="button"
          className={`public-mobile-menu-btn ${
            showMobileMenu ? "active" : ""
          }`}
          onClick={() => setShowMobileMenu((prev) => !prev)}
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </header>

      {showMobileMenu && (
        <div className="public-mobile-overlay" onClick={closeMobileMenu}>
          <aside
            className="public-mobile-sidebar"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="public-mobile-sidebar-header">
              <Link
                to="/"
                className="brand-area brand-link"
                onClick={handleHomeClick}
              >
                <div className="brand-logo">🐾</div>

                <h1 className="brand-name">
                  Paw<span>Guard</span>
                </h1>
              </Link>

              <button
                type="button"
                className="public-mobile-close-btn"
                onClick={closeMobileMenu}
                aria-label="Close menu"
              >
                ×
              </button>
            </div>

            <nav className="public-mobile-links">
              <a
                href="/"
                className={isHome ? "active" : ""}
                onClick={handleHomeClick}
              >
                <span>🏠</span>
                Home
              </a>

              <NavLink to="/emergency-search" onClick={closeMobileMenu}>
                <span>📋</span>
                Guides
              </NavLink>

              <NavLink to="/quiz" onClick={closeMobileMenu}>
                <span>🧠</span>
                Quizzes
              </NavLink>

              <NavLink to="/feedback" onClick={closeMobileMenu}>
                <span>💬</span>
                Feedback
              </NavLink>

              <NavLink to="/about" onClick={closeMobileMenu}>
                <span>ℹ️</span>
                About
              </NavLink>
            </nav>

            <div className="public-mobile-actions">
              {user ? (
                <>
                  <button
                    type="button"
                    className="public-mobile-dashboard-btn"
                    onClick={handleDashboardClick}
                  >
                    {dashboardLabel}
                  </button>

                  <button
                    type="button"
                    className="public-mobile-logout-btn"
                    onClick={openLogoutModal}
                  >
                    Log out
                  </button>
                </>
              ) : (
                <NavLink
                  to="/login"
                  className="public-mobile-login-btn"
                  onClick={closeMobileMenu}
                >
                  Login
                </NavLink>
              )}
            </div>
          </aside>
        </div>
      )}

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