import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const API_BASE_URL = "http://localhost:5000";

export default function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone_no: "",
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });

    setError("");
  };

  const getPasswordStrength = () => {
    const password = formData.password;
    let strength = 0;

    if (password.length >= 6) strength++;
    if (password.length >= 8) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    return strength;
  };

  const getStrengthText = () => {
    const strength = getPasswordStrength();

    if (!formData.password) {
      return "Use 8+ characters with numbers and symbols";
    }

    if (strength <= 1) {
      return "Weak password";
    }

    if (strength === 2) {
      return "Medium password";
    }

    if (strength === 3) {
      return "Good password";
    }

    return "Strong password";
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setShowSuccessToast(false);

    if (
      !formData.firstName ||
      !formData.lastName ||
      !formData.email ||
      !formData.phone_no ||
      !formData.password ||
      !formData.confirmPassword
    ) {
      setError("Please fill in all fields.");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Password and confirm password do not match.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: `${formData.firstName} ${formData.lastName}`,
          email: formData.email,
          phone_no: formData.phone_no,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Registration failed. Please try again.");
        return;
      }

      setShowSuccessToast(true);

      setTimeout(() => {
        navigate("/login");
      }, 1400);
    } catch (error) {
      console.error("Register error:", error);
      setError("Cannot connect to server. Please make sure backend is running.");
    } finally {
      setLoading(false);
    }
  };

  const strength = getPasswordStrength();

  return (
    <main className="register-page">
      {showSuccessToast && (
        <div className="register-success-toast">
          <div className="register-success-toast-icon">✓</div>

          <div>
            <strong>Account created successfully</strong>
            <p>Redirecting you to the login page...</p>
          </div>
        </div>
      )}

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
            <span>🐾</span>
            <span>🐾</span>
            <span>🐾</span>
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

          <form className="register-form" onSubmit={handleRegister}>
            {error && (
              <div className="auth-alert error">
                <div className="auth-alert-icon">!</div>
                <div className="auth-alert-text">
                  <strong>Registration failed</strong>
                  {error}
                </div>
              </div>
            )}

            <div className="register-row">
              <div className="input-group">
                <label>First name</label>
                <div className="input-wrapper">
                  <span className="input-icon">👤</span>
                  <input
                    type="text"
                    name="firstName"
                    placeholder="John"
                    value={formData.firstName}
                    onChange={handleChange}
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="input-group">
                <label>Last name</label>
                <div className="input-wrapper">
                  <span className="input-icon">👤</span>
                  <input
                    type="text"
                    name="lastName"
                    placeholder="Doe"
                    value={formData.lastName}
                    onChange={handleChange}
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            <div className="input-group">
              <label>Email address</label>
              <div className="input-wrapper">
                <span className="input-icon">✉️</span>
                <input
                  type="email"
                  name="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="input-group">
              <label>Phone number</label>
              <div className="input-wrapper">
                <span className="input-icon">📱</span>
                <input
                  type="text"
                  name="phone_no"
                  placeholder="0123456789"
                  value={formData.phone_no}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="input-group">
              <label>Password</label>
              <div className="input-wrapper">
                <span className="input-icon">🔒</span>
                <input
                  type="password"
                  name="password"
                  placeholder="Create a password"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="forgot-strength register-strength">
              <p className="strength-label">Password strength</p>

              <div className="strength-bars">
                <div className={`strength-bar ${strength >= 1 ? "active" : ""}`}></div>
                <div className={`strength-bar ${strength >= 2 ? "active" : ""}`}></div>
                <div className={`strength-bar ${strength >= 3 ? "active" : ""}`}></div>
                <div className={`strength-bar ${strength >= 4 ? "active" : ""}`}></div>
              </div>

              <p className="strength-hint">{getStrengthText()}</p>
            </div>

            <div className="input-group">
              <label>Confirm password</label>
              <div className="input-wrapper">
                <span className="input-icon">🔒</span>
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Repeat your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
            </div>

            <button className="register-btn" type="submit" disabled={loading}>
              {loading ? (
                <>
                  Creating<span className="auth-loading-dots"></span>
                </>
              ) : (
                <>
                  Create Account <span className="btn-arrow">{"→"}</span>
                </>
              )}
            </button>

            <p className="register-footer-text">
              Already have an account? <Link to="/login">Sign in</Link>
            </p>
          </form>
        </div>
      </section>
    </main>
  );
}