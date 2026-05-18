import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const API_BASE_URL = "http://localhost:5000";

export default function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    setError("");
    setMessage("");

    if (!formData.email || !formData.password) {
      setError("Please enter email and password.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Login failed. Please try again.");
        return;
      }

      // Save login data
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      setMessage("Login successful. Redirecting...");

      // Redirect based on role
      setTimeout(() => {
        if (data.user.role === "admin") {
          navigate("/admin/dashboard");
        } else if (data.user.role === "pet_owner") {
          navigate("/petowner/dashboard");
        } else {
          navigate("/");
        }
      }, 900);
    } catch (error) {
      console.error("Login error:", error);
      setError("Cannot connect to server. Please make sure backend is running.");
    } finally {
      setLoading(false);
    }
  };

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
            <span>🐾</span>
            <span>🐾</span>
            <span>🐾</span>
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

          <form className="login-form" onSubmit={handleLogin}>
            {error && (
              <div className="auth-alert error">
                <div className="auth-alert-icon">!</div>
                <div className="auth-alert-text">
                  <strong>Login failed</strong>
                  {error}
                </div>
              </div>
            )}

            {message && (
              <div className="auth-alert success">
                <div className="auth-alert-icon">✓</div>
                <div className="auth-alert-text">
                  <strong>Login successful</strong>
                  {message}
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
                  placeholder="you@example.com"
                  value={formData.email}
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
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="login-options">
              <label className="remember-label">
                <input type="checkbox" disabled={loading} />
                <span>Remember me</span>
              </label>

              <Link to="/forgot-password" className="forgot-link">
                Forgot password?
              </Link>
            </div>

            <button className="login-btn" type="submit" disabled={loading}>
              {loading ? (
                <>
                  Signing in<span className="auth-loading-dots"></span>
                </>
              ) : (
                <>
                  Sign In <span className="btn-arrow">{"→"}</span>
                </>
              )}
            </button>

            <p className="login-footer-text">
              New here? <Link to="/register">Create an account</Link>
            </p>
          </form>
        </div>
      </section>
    </main>
  );
}