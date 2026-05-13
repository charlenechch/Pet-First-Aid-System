import { Link } from "react-router-dom";

export default function ForgotPassword() {
  return (
    <main className="forgot-page">
      <section className="forgot-card">
        <div className="forgot-icon">🔐</div>

        <h1>Forgot Password</h1>

        <p>
          Enter your email address and we will send instructions to reset your
          password.
        </p>

        <label>Email address</label>
        <input type="email" placeholder="you@example.com" />

        <button>Send Reset Link</button>

        <Link to="/login" className="forgot-back-link">
          Back to Login
        </Link>
      </section>
    </main>
  );
}