import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../../styles/admin.css";

function TopNavbar({ onMenuClick }) {
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  function openLogoutModal() {
    setShowLogoutModal(true);
  }

  function closeLogoutModal() {
    setShowLogoutModal(false);
  }

  function handleLogoutConfirm() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setShowLogoutModal(false);
    navigate("/", { replace: true });
  }

  function handleGoHome() {
    navigate("/");
  }

  return (
    <>
      <header className="top-navbar">
        <div className="top-navbar-left">
          <button className="drawer-toggle-btn" onClick={onMenuClick}>
            ☰
          </button>

          <Link to="/admin/dashboard" className="brand-area brand-link">
            <div className="brand-logo">🐾</div>

            <h1 className="brand-name">
              Paw<span>Guard</span>
            </h1>
          </Link>
        </div>

        <div className="top-navbar-center">
          <p>Admin Panel</p>
        </div>

        <div className="top-navbar-right">
          <button type="button" className="admin-home-btn" onClick={handleGoHome}>
            Home
          </button>

          <Link
            to="/admin/profile"
            className="admin-avatar-link"
            title="Admin Profile"
          >
            <div className="top-admin-avatar">A</div>
          </Link>

          <button className="logout-btn" onClick={openLogoutModal}>
            Log out
          </button>
        </div>
      </header>

      {showLogoutModal && (
        <div className="ad-logout-modal-overlay">
          <div className="ad-logout-modal">
            <div className="ad-logout-modal-icon">🚪</div>

            <h2>Log out?</h2>

            <p>
              You will be signed out from the PawGuard admin panel. You can log
              in again anytime using your admin account.
            </p>

            <div className="ad-logout-modal-actions">
              <button
                type="button"
                className="ad-logout-cancel-btn"
                onClick={closeLogoutModal}
              >
                Cancel
              </button>

              <button
                type="button"
                className="ad-logout-confirm-btn"
                onClick={handleLogoutConfirm}
              >
                Yes, log out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default TopNavbar;