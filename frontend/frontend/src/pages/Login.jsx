import { Link } from "react-router-dom";

export default function Login() {
  return (
    <main className="login-page">
      <section className="login-left">
        <div className="login-brand-icon">🐾</div>

        <h1>Welcome back to PawGuard</h1>

        <p>
          Access saved guides, pet profiles, and emergency first-aid support
          anytime.
        </p>

        <div className="login-quote">
          “The best time to learn pet first-aid is before you need it.”
        </div>
      </section>

      <section className="login-right">
        <div className="login-card">
          <div className="login-card-icon">🐶</div>

          <h2>Login</h2>

          <p>
            Don&apos;t have an account?{" "}
            <Link to="/register">Register here</Link>
          </p>

          <label>Email address</label>
          <input type="email" placeholder="you@example.com" />

          <label>Password</label>
          <input type="password" placeholder="Enter password" />

          <div className="login-options">
            <label>
              <input type="checkbox" />
              Remember me
            </label>

            <Link to="/forgot-password">Forgot password?</Link>
          </div>

          <button>Login →</button>
        </div>
      </section>
    </main>
  );
}