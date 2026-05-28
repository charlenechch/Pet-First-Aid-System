import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import "../../styles/admin.css";

function AdminDrawer({ isOpen, onClose }) {
  const navigate = useNavigate();

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showLogoutSuccess, setShowLogoutSuccess] = useState(false);

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
    setShowLogoutSuccess(true);

    setTimeout(() => {
      setShowLogoutSuccess(false);
      onClose();
      navigate("/", { replace: true });
    }, 1200);
  }

  return (
    <>
      <aside className={`admin-drawer ${isOpen ? "open" : ""}`}>
        <div className="drawer-header">
          <div>
            <p className="drawer-small-title">Admin Panel</p>
            <h2>PawGuard Admin</h2>
          </div>

          <button className="drawer-close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="drawer-content">
          <nav className="drawer-nav">
            <NavLink to="/admin/dashboard" onClick={onClose}>
              <span>📊</span>
              Dashboard
            </NavLink>

            <NavLink to="/admin/pet-topics" onClick={onClose}>
              <span>🐾</span>
              Pet & Topics
            </NavLink>

            <NavLink to="/admin/guide-content" onClick={onClose}>
              <span>📋</span>
              Guide Content
            </NavLink>

            <NavLink to="/admin/quizzes" onClick={onClose}>
              <span>🧠</span>
              Quizzes
            </NavLink>

            <NavLink to="/admin/feedback" onClick={onClose}>
              <span>💬</span>
              Feedback
            </NavLink>

            <NavLink to="/admin/users" onClick={onClose}>
              <span>👥</span>
              Users
            </NavLink>

            <NavLink to="/admin/profile" onClick={onClose}>
              <span>👤</span>
              Profile
            </NavLink>
          </nav>

          <div className="drawer-logout-area">
            <button className="drawer-logout-btn" onClick={openLogoutModal}>
              <span>🚪</span>
              Log out
            </button>
          </div>
        </div>
      </aside>

      {isOpen && <div className="drawer-overlay" onClick={onClose}></div>}

      {showLogoutModal && (
        <div className="po-logout-modal-overlay">
          <div className="po-logout-modal">
            <div className="po-logout-modal-icon">🚪</div>

            <h2>Log out?</h2>

            <p>
              You will be signed out from the PawGuard admin panel. You can log
              in again anytime using your admin account.
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

      {showLogoutSuccess && (
        <div className="po-logout-success">
          <div className="po-logout-success-icon">✓</div>

          <div>
            <strong>Logged out successfully</strong>
            <p>You are returning to the home page.</p>
          </div>
        </div>
      )}
    </>
  );
}

export default AdminDrawer;