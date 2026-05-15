import { Link } from "react-router-dom";

export default function Register() {
  return (
    <main className="register-page">
      <section className="register-left">
        <div className="register-left-content">
          <div className="register-brand-icon">🐾</div>
          <h1>Join PawGuard today</h1>
          <p>
            Create an account to save guides, manage pet profiles, and access
            emergency first-aid support anytime.
          </p>
          <div className="register-quote">
            <span className="quote-mark">&ldquo;</span>
            Being prepared can make a big difference during a pet emergency.
            <span className="quote-mark">&rdquo;</span>
          </div>
          <div className="register-paws">
            <span>🐾</span><span>🐾</span><span>🐾</span>
          </div>
        </div>
      </section>

      <section className="register-right">
        <div className="register-card">
          <div className="register-card-header">
            <div className="register-card-icon">🐶</div>
            <h2>Create Account</h2>
            <p className="register-subtitle">Start protecting your pet today</p>
          </div>

          <div className="register-form">
            <div className="register-row">
              <div className="input-group">
                <label>First name</label>
                <div className="input-wrapper">
                  <span className="input-icon">👤</span>
                  <input type="text" placeholder="John" />
                </div>
              </div>
              <div className="input-group">
                <label>Last name</label>
                <div className="input-wrapper">
                  <span className="input-icon">👤</span>
                  <input type="text" placeholder="Doe" />
                </div>
              </div>
            </div>

            <div className="input-group">
              <label>Email address</label>
              <div className="input-wrapper">
                <span className="input-icon">✉️</span>
                <input type="email" placeholder="you@example.com" />
              </div>
            </div>

            <div className="input-group">
              <label>Password</label>
              <div className="input-wrapper">
                <span className="input-icon">🔒</span>
                <input type="password" placeholder="Create a password" />
              </div>
            </div>

            <div className="input-group">
              <label>Confirm password</label>
              <div className="input-wrapper">
                <span className="input-icon">🔒</span>
                <input type="password" placeholder="Repeat your password" />
              </div>
            </div>

            <button className="register-btn">
              Create Account <span className="btn-arrow">{"→"}</span>
            </button>

            <p className="register-footer-text">
              Already have an account? <Link to="/login">Sign in</Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}