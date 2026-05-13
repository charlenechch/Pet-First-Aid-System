import { NavLink, Link, useNavigate, useLocation } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const isHome = location.pathname === "/";

  const handleHomeClick = (e) => {
    e.preventDefault();
    if (isHome) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      navigate("/");
    }
  };

  return (
    <nav className="pg-navbar">
      <Link to="/" className="pg-logo" onClick={handleHomeClick}>
        <span className="pg-logo-icon">🐾</span>
        <span>
          Paw<span>Guard</span>
        </span>
      </Link>

      <div className="pg-nav-center">
        <a
          href="/"
          className={isHome ? "pg-home-navlink active" : "pg-home-navlink"}
          onClick={handleHomeClick}
        >
          Home
        </a>
        <NavLink to="/emergency-search">Guides</NavLink>
        <NavLink to="/quiz">Quiz</NavLink>
        <NavLink to="/feedback">Feedback</NavLink>
        <NavLink to="/about">About</NavLink>
      </div>

      <div className="pg-nav-actions">
        <NavLink to="/login" className="pg-login-link">
          Login
        </NavLink>
        <NavLink to="/register" className="pg-register-link">
          Register
        </NavLink>
      </div>
    </nav>
  );
}