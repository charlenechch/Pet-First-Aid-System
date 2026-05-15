import { Link } from "react-router-dom";

export default function ForgotPassword() {
  return (
    <main className="forgot-page">
      <div className="forgot-left">
        <div className="forgot-left-content">
          <div className="forgot-brand-icon">🐾</div>
          <h1>Reset Your Password</h1>
          <p>
            Create a new password for your PawGuard account. Make sure it's
            something secure and memorable.
          </p>
          <div className="forgot-quote">
            <span className="quote-mark">&ldquo;</span>
            Your pets count on you — and we make sure you can always get back in.
            <span className="quote-mark">&rdquo;</span>
          </div>
          <div className="forgot-paws">
            <span>🐾</span><span>🐾</span><span>🐾</span>
          </div>
        </div>
      </div>

      <div className="forgot-right">
        <div className="forgot-card">
          <div className="forgot-card-header">
            <div className="forgot-icon">🔐</div>
            <h2>New Password</h2>
            <p className="forgot-subtitle">
              Enter and confirm your new password below
            </p>
          </div>

          <div className="forgot-form">
            <div className="input-group">
              <label>New password</label>
              <div className="input-wrapper">
                <span className="input-icon">🔒</span>
                <input type="password" placeholder="Enter new password" />
              </div>
            </div>

            <div className="input-group">
              <label>Confirm new password</label>
              <div className="input-wrapper">
                <span className="input-icon">🔒</span>
                <input type="password" placeholder="Re-enter new password" />
              </div>
            </div>

            <div className="forgot-strength">
              <p className="strength-label">Password strength</p>
              <div className="strength-bars">
                <div className="strength-bar active"></div>
                <div className="strength-bar active"></div>
                <div className="strength-bar active"></div>
                <div className="strength-bar"></div>
              </div>
              <p className="strength-hint">Use 8+ characters with numbers and symbols</p>
            </div>

            <button className="forgot-btn">
              Reset Password <span className="btn-arrow">{"→"}</span>
            </button>

            <Link to="/login" className="forgot-back-link">
              ← Back to Login
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}