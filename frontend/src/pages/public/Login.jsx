import { Link } from "react-router-dom";

export default function Login() {
  return (
    <main className="login-page">
      <section className="login-left">
        <div className="login-left-content">
          <div className="login-brand-icon">🐾</div>
          <h1>Welcome back to PawGuard</h1>
          <p>
            Access saved guides, pet profiles, and emergency first-aid support
            anytime.
          </p>
          <div className="login-quote">
            <span className="quote-mark">&ldquo;</span>
            The best time to learn pet first-aid is before you need it.
            <span className="quote-mark">&rdquo;</span>
          </div>
          <div className="login-paws">
            <span>🐾</span><span>🐾</span><span>🐾</span>
          </div>
        </div>
      </section>

      <section className="login-right">
        <div className="login-card">
          <div className="login-card-header">
            <div className="login-card-icon">🐶</div>
            <h2>Welcome back</h2>
            <p className="login-subtitle">Sign in to your PawGuard account</p>
          </div>

          <div className="login-form">
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
                <input type="password" placeholder="Enter your password" />
              </div>
            </div>

            <div className="login-options">
              <label className="remember-label">
                <input type="checkbox" />
                <span>Remember me</span>
              </label>
              <Link to="/forgot-password" className="forgot-link">
                Forgot password?
              </Link>
            </div>

            <button className="login-btn">
              Sign In <span className="btn-arrow">{"→"}</span>
            </button>

            <p className="login-footer-text">
              New here?{" "}
              <Link to="/register">Create an account</Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}