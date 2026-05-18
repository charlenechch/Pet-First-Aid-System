import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import "../../styles/admin.css";

function AdminDrawer({ isOpen, onClose }) {
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
    onClose();

    navigate("/", { replace: true });
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

export default AdminDrawer;