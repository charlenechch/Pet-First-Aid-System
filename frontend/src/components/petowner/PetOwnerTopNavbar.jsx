import { Link } from "react-router-dom";
import "../../styles/admin.css";
import "../../styles/petOwner.css";

function PetOwnerTopNavbar({ onMenuClick }) {
  return (
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
        <Link
          to="/petowner/profile"
          className="admin-avatar-link"
          title="My Profile"
        >
          <div className="top-admin-avatar">J</div>
        </Link>

        <button className="logout-btn">Log out</button>
      </div>
    </header>
  );
}

export default PetOwnerTopNavbar;
