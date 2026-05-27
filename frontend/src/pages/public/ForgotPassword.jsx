import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function ForgotPassword() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));

    setError("");
    setMessage("");
  };

  const getPasswordStrength = () => {
    const password = formData.newPassword;
    let strength = 0;

    if (password.length >= 6) strength++;
    if (password.length >= 8) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    return strength;
  };

  const getStrengthText = () => {
    const strength = getPasswordStrength();

    if (!formData.newPassword) {
      return "Use 8+ characters with numbers and symbols";
    }

    if (strength <= 1) return "Weak password";
    if (strength === 2) return "Medium password";
    if (strength === 3) return "Good password";
    return "Strong password";
  };

  async function readJson(response) {
    try {
      return await response.json();
    } catch {
      return {};
    }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault();

    setError("");
    setMessage("");

    if (!formData.email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    if (!formData.newPassword || !formData.confirmPassword) {
      setError("Please fill in all password fields.");
      return;
    }

    if (formData.newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError("New password and confirm password do not match.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email.trim(),
          newPassword: formData.newPassword,
          confirmPassword: formData.confirmPassword,
        }),
      });

      const data = await readJson(response);

      if (!response.ok) {
        setError(data.message || "Password reset failed. Please try again.");
        return;
      }

      setMessage("Password reset successfully. Redirecting to login...");

      setTimeout(() => {
        navigate("/login");
      }, 1200);
    } catch (error) {
      console.error("Reset password error:", error);
      setError("Cannot connect to server. Please make sure backend is running.");
    } finally {
      setLoading(false);
    }
  };

  const strength = getPasswordStrength();

  return (
    <main className="forgot-page">
      <div className="forgot-left">
        <div className="forgot-left-content">
          <div className="forgot-brand-icon">🐾</div>

          <h1>Reset Your Password</h1>

          <p>
            Create a new password for your PawGuard account. Make sure it is
            something secure and memorable.
          </p>

          <div className="forgot-quote">
            <span className="quote-mark">&ldquo;</span>
            Your pets count on you — and we make sure you can always get back in.
            <span className="quote-mark">&rdquo;</span>
          </div>

          <div className="forgot-paws">
            <span>🐾</span>
            <span>🐾</span>
            <span>🐾</span>
          </div>
        </div>
      </div>

      <div className="forgot-right">
        <div className="forgot-card">
          <div className="forgot-card-header">
            <div className="forgot-icon">🔐</div>

            <h2>New Password</h2>

            <p className="forgot-subtitle">
              Enter your email and confirm your new password below
            </p>
          </div>

          <form className="forgot-form" onSubmit={handleResetPassword}>
            {error && (
              <div className="auth-alert error">
                <div className="auth-alert-icon">!</div>

                <div className="auth-alert-text">
                  <strong>Password reset failed</strong>
                  <span>{error}</span>
                </div>
              </div>
            )}

            {message && (
              <div className="auth-alert success">
                <div className="auth-alert-icon">✓</div>

                <div className="auth-alert-text">
                  <strong>Password reset successful</strong>
                  <span>{message}</span>
                </div>
              </div>
            )}

            <div className="input-group">
              <label>Email address</label>

              <div className="input-wrapper">
                <span className="input-icon">✉️</span>

                <input
                  type="email"
                  name="email"
                  placeholder="Enter your account email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="input-group">
              <label>New password</label>

              <div className="input-wrapper password-wrapper">
                <span className="input-icon">🔒</span>

                <input
                  type={showNewPassword ? "text" : "password"}
                  name="newPassword"
                  placeholder="Enter new password"
                  value={formData.newPassword}
                  onChange={handleChange}
                  disabled={loading}
                />

                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowNewPassword((prev) => !prev)}
                  disabled={loading}
                  aria-label={
                    showNewPassword ? "Hide new password" : "Show new password"
                  }
                >
                  {showNewPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            <div className="input-group">
              <label>Confirm new password</label>

              <div className="input-wrapper password-wrapper">
                <span className="input-icon">🔒</span>

                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  placeholder="Re-enter new password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  disabled={loading}
                />

                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  disabled={loading}
                  aria-label={
                    showConfirmPassword
                      ? "Hide confirm password"
                      : "Show confirm password"
                  }
                >
                  {showConfirmPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            <div className="forgot-strength">
              <p className="strength-label">Password strength</p>

              <div className="strength-bars">
                <div
                  className={`strength-bar ${strength >= 1 ? "active" : ""}`}
                />
                <div
                  className={`strength-bar ${strength >= 2 ? "active" : ""}`}
                />
                <div
                  className={`strength-bar ${strength >= 3 ? "active" : ""}`}
                />
                <div
                  className={`strength-bar ${strength >= 4 ? "active" : ""}`}
                />
              </div>

              <p className="strength-hint">{getStrengthText()}</p>
            </div>

            <button className="forgot-btn" type="submit" disabled={loading}>
              {loading ? (
                <>
                  Resetting<span className="auth-loading-dots"></span>
                </>
              ) : (
                <>
                  Reset Password <span className="btn-arrow">{"→"}</span>
                </>
              )}
            </button>

            <Link to="/login" className="forgot-back-link">
              ← Back to Login
            </Link>
          </form>
        </div>
      </div>
    </main>
  );
}