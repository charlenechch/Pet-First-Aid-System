import { useNavigate, useLocation } from "react-router-dom";

export default function Footer() {
  const navigate = useNavigate();
  const location = useLocation();

  const scrollToPageTop = (behavior = "smooth") => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior,
    });
  };

  const handleFooterLinkClick = (e, path) => {
    e.preventDefault();

    // If user is already on the same page, just scroll to top
    if (location.pathname === path) {
      scrollToPageTop("smooth");
      return;
    }

    // If different page, navigate first
    navigate(path);

    // Extra safety: make sure new page starts from top
    setTimeout(() => {
      scrollToPageTop("auto");
    }, 0);
  };

  return (
    <footer className="pg-footer">
      {/* TOP BAND */}
      <div className="pg-footer-band">
        <div className="pg-footer-band-inner">
          <div className="pg-footer-band-left">
            <span className="pg-footer-band-icon">🚨</span>
            <p>
              Pet emergency? Call your vet immediately — PawGuard guides are
              first-aid support only.
            </p>
          </div>

          <a href="tel:+60123456789" className="pg-footer-band-btn">
            📞 +60 12-345 6789
          </a>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="pg-footer-top">
        {/* BRAND */}
        <div className="pg-footer-brand">
          <div className="pg-footer-logo">
            <span>🐾</span>
          </div>

          <h2>
            Paw<span>Guard</span>
          </h2>

          <p>
            Helping pet owners respond quickly during emergencies with simple
            and reliable first-aid guides.
          </p>

          <div className="pg-footer-pets">
            {["🐶", "🐱", "🐰", "🐦"].map((p) => (
              <span key={p} className="pg-footer-pet">
                {p}
              </span>
            ))}
          </div>
        </div>

        {/* QUICK LINKS */}
        <div className="pg-footer-col">
          <h3>Quick Links</h3>

          <div className="pg-footer-links">
            <a href="/" onClick={(e) => handleFooterLinkClick(e, "/")}>
              Home
            </a>

            <a
              href="/emergency-search"
              onClick={(e) => handleFooterLinkClick(e, "/emergency-search")}
            >
              Guides
            </a>

            <a href="/quiz" onClick={(e) => handleFooterLinkClick(e, "/quiz")}>
              Quiz
            </a>

            <a
              href="/feedback"
              onClick={(e) => handleFooterLinkClick(e, "/feedback")}
            >
              Feedback
            </a>

            <a
              href="/about"
              onClick={(e) => handleFooterLinkClick(e, "/about")}
            >
              About
            </a>
          </div>
        </div>

        {/* ACCOUNT */}
        <div className="pg-footer-col">
          <h3>Account</h3>

          <div className="pg-footer-links">
            <a
              href="/login"
              onClick={(e) => handleFooterLinkClick(e, "/login")}
            >
              Login
            </a>

            <a
              href="/register"
              onClick={(e) => handleFooterLinkClick(e, "/register")}
            >
              Register
            </a>

            <a
              href="/forgot-password"
              onClick={(e) => handleFooterLinkClick(e, "/forgot-password")}
            >
              Forgot Password
            </a>
          </div>
        </div>

        {/* CONTACT */}
        <div className="pg-footer-col">
          <h3>Emergency Contact</h3>

          <div className="pg-footer-contact-box">
            <div className="pg-footer-contact-icon">📞</div>
            <div>
              <strong>24/7 Vet Hotline</strong>
              <p>+60 12-345 6789</p>
            </div>
          </div>

          <div className="pg-footer-contact-box warning">
            <div className="pg-footer-contact-icon">⚠️</div>
            <div>
              <strong>Reminder</strong>
              <p>PawGuard does not replace professional vet care.</p>
            </div>
          </div>

          <div className="pg-footer-contact-box aspca">
            <div className="pg-footer-contact-icon">🌐</div>
            <div>
              <strong>ASPCA Hotline</strong>
              <p>888-426-4435</p>
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM BAR */}
      <div className="pg-footer-bottom">
        <p>© 2026 PawGuard. All rights reserved. Built with ❤️ for pet owners.</p>

        <div className="pg-footer-socials">
          {["🐶", "🐱", "🐰"].map((p) => (
            <span key={p} className="pg-footer-social-btn">
              {p}
            </span>
          ))}
        </div>
      </div>
    </footer>
  );
}