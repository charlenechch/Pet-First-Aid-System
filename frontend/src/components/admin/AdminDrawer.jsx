import { NavLink } from "react-router-dom";
import "../../styles/admin.css";

function AdminDrawer({ isOpen, onClose }) {
  function handleLogout() {
    const confirmLogout = window.confirm("Are you sure you want to log out?");

    if (!confirmLogout) return;

    alert("Logged out successfully. This is hardcoded for now.");
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
            <button className="drawer-logout-btn" onClick={handleLogout}>
              <span>🚪</span>
              Log out
            </button>
          </div>
        </div>
      </aside>

      {isOpen && <div className="drawer-overlay" onClick={onClose}></div>}
    </>
  );
}

export default AdminDrawer;