import { Link } from "react-router-dom";
import "../../styles/admin.css";

function TopNavbar({ onMenuClick }) {
  return (
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
        <Link to="/admin/profile" className="admin-avatar-link" title="Admin Profile">
          <div className="top-admin-avatar">A</div>
        </Link>

        <button className="logout-btn">Log out</button>
      </div>
    </header>
  );
}

export default TopNavbar;