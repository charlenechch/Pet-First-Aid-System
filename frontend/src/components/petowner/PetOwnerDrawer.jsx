import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import "../../styles/admin.css";
import "../../styles/petOwner.css";

function PetOwnerDrawer({ isOpen, onClose }) {
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
            <p className="drawer-small-title">Pet Owner Menu</p>
            <h2>My PawGuard</h2>
          </div>

          <button className="drawer-close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="drawer-content">
          <nav className="drawer-nav">
            <NavLink to="/petowner/dashboard" onClick={onClose}>
              <span>🏠</span>
              Dashboard
            </NavLink>

            <NavLink to="/petowner/bookmarks" onClick={onClose}>
              <span>🔖</span>
              My Bookmarks
            </NavLink>

            <NavLink to="/petowner/quizzes" onClick={onClose}>
              <span>🧠</span>
              Quizzes
            </NavLink>

            <NavLink to="/petowner/feedback" onClick={onClose}>
              <span>💬</span>
              Feedback
            </NavLink>

            <NavLink to="/petowner/profile" onClick={onClose}>
              <span>👤</span>
              My Profile
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

export default PetOwnerDrawer;