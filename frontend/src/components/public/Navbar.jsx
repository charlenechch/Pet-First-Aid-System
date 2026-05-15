import { NavLink, Link, useNavigate, useLocation } from "react-router-dom";
import "../../styles/admin.css";

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
    <header className="public-top-navbar">
      <div className="public-navbar-left">
        <Link to="/" className="brand-area brand-link" onClick={handleHomeClick}>
          <div className="brand-logo">🐾</div>

          <h1 className="brand-name">
            Paw<span>Guard</span>
          </h1>
        </Link>
      </div>

      <nav className="public-nav-links">
        <a
          href="/"
          className={isHome ? "active" : ""}
          onClick={handleHomeClick}
        >
          Home
        </a>

        <NavLink to="/emergency-search">Guides</NavLink>
        <NavLink to="/quiz">Quiz</NavLink>
        <NavLink to="/feedback">Feedback</NavLink>
        <NavLink to="/about">About</NavLink>
      </nav>

      <div className="public-navbar-right">
        <NavLink to="/login" className="public-login-btn">
          Login
        </NavLink>
      </div>
    </header>
  );
}