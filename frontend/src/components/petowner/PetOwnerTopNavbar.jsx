import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../../styles/admin.css";
import "../../styles/petOwner.css";

function PetOwnerTopNavbar({ onMenuClick }) {
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

          <Link to="/petowner/dashboard" className="brand-area brand-link">
            <div className="brand-logo">🐾</div>

            <h1 className="brand-name">
              Paw<span>Guard</span>
            </h1>
          </Link>
        </div>

        <div className="top-navbar-center">
          <p>Pet Owner</p>
        </div>

        <div className="top-navbar-right">
          <button
            type="button"
            className="po-home-btn"
            onClick={handleGoHome}
          >
            Home
          </button>

          <Link
            to="/petowner/profile"
            className="admin-avatar-link"
            title="My Profile"
          >
            <div className="top-admin-avatar">J</div>
          </Link>

          <button className="logout-btn" onClick={openLogoutModal}>
            Log out
          </button>
        </div>
      </header>

      {showLogoutModal && (
        <div className="po-logout-modal-overlay">
          <div className="po-logout-modal">
            <div className="po-logout-modal-icon">🚪</div>

            <h2>Log out?</h2>

            <p>
              You will be signed out from your PawGuard pet owner account. You
              can log in again anytime.
            </p>

            <div className="po-logout-modal-actions">
              <button
                type="button"
                className="po-logout-cancel-btn"
                onClick={closeLogoutModal}
              >
                Cancel
              </button>

              <button
                type="button"
                className="po-logout-confirm-btn"
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

export default PetOwnerTopNavbar;