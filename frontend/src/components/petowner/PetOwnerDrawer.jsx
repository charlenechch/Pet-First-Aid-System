import { NavLink } from "react-router-dom";
import "../../styles/admin.css";
import "../../styles/petOwner.css";

function PetOwnerDrawer({ isOpen, onClose }) {
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

export default PetOwnerDrawer;
