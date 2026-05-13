import { Link } from "react-router-dom";

export default function Register() {
  return (
    <main className="register-page">
      <section className="register-left">
        <div className="register-brand-icon">🐾</div>

        <h1>Join PawGuard today</h1>

        <p>
          Create an account to save guides, manage pet profiles, and access
          emergency first-aid support anytime.
        </p>

        <div className="register-quote">
          “Being prepared can make a big difference during a pet emergency.”
        </div>
      </section>

      <section className="register-right">
        <div className="register-card">
          <div className="register-card-icon">🐶</div>

          <h2>Create Account</h2>

          <p>
            Already have an account? <Link to="/login">Login here</Link>
          </p>

          <div className="register-row">
            <input type="text" placeholder="First name" />
            <input type="text" placeholder="Last name" />
          </div>

          <input type="email" placeholder="Email address" />
          <input type="password" placeholder="Password" />
          <input type="password" placeholder="Confirm password" />

          <button>Register →</button>
        </div>
      </section>
    </main>
  );
}