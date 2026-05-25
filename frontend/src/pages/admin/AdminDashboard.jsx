import { useEffect, useState } from "react";
import AdminCard from "../../components/admin/AdminCard";
import AdminTable from "../../components/admin/AdminTable";
import "../../styles/admin.css";
import "../../styles/adminDashboard.css";

const API_URL = import.meta.env.VITE_API_URL;

// Presentational config for the stat cards. The icons + titles live
// here on the frontend; only the live `value` comes from the backend,
// matched in by `key` (users / guides / quizzes / feedback).
const STAT_CARDS = [
  { key: "users", title: "Registered users", icon: "👥" },
  { key: "guides", title: "Published guides", icon: "📘" },
  { key: "quizzes", title: "Active quizzes", icon: "🧠" },
  { key: "feedback", title: "Feedback received", icon: "💬" },
];

// Turn a timestamp into "Today" / "Yesterday" / "3 days ago"
function relativeDay(dateString) {
  if (!dateString) return "";
  const days = Math.floor(
    (new Date() - new Date(dateString)) / (1000 * 60 * 60 * 24)
  );
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}

// Map a rating to the colour class your CSS already uses
function feedbackType(rating) {
  if (rating >= 4) return "positive";
  if (rating === 3) return "warning";
  return "negative";
}

function AdminDashboard() {
  const [stats, setStats] = useState({
    users: 0,
    guides: 0,
    quizzes: 0,
    feedback: 0,
  });
  const [recentRegistrations, setRecentRegistrations] = useState([]);
  const [recentFeedback, setRecentFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      try {
        // NOTE: match this key to whatever your teammate's login saves the JWT under
        const token = localStorage.getItem("token");

        const res = await fetch(`${API_URL}/api/admin/dashboard`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.message || "Failed to load dashboard.");
        }

        const data = await res.json();
        setStats(data.stats);
        setRecentRegistrations(data.recentRegistrations);
        setRecentFeedback(data.recentFeedback);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="admin-page">
        <p>Loading dashboard…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-page">
        <p style={{ color: "crimson" }}>{error}</p>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="page-title-area">
        <p className="page-subtitle">Welcome back, Admin</p>
        <h1>Admin Overview</h1>
      </div>

      <div className="stats-grid">
        {STAT_CARDS.map((card) => (
          <AdminCard
            key={card.key}
            icon={card.icon}
            value={stats[card.key]}
            title={card.title}
          />
        ))}
      </div>

      <div className="dashboard-grid">
        <AdminTable title="Recent Registrations">
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Joined</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {recentRegistrations.length === 0 ? (
                  <tr>
                    <td colSpan="3">No registrations yet.</td>
                  </tr>
                ) : (
                  recentRegistrations.map((user, index) => (
                    <tr key={index}>
                      <td>
                        <strong className="cell-title">{user.name}</strong>
                      </td>

                      <td>{relativeDay(user.created_at)}</td>

                      <td>
                        <span className="status-badge">{user.status}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </AdminTable>

        <AdminTable title="Recent Feedback">
          <div className="feedback-list">
            {recentFeedback.length === 0 ? (
              <p>No feedback yet.</p>
            ) : (
              recentFeedback.map((feedback, index) => (
                <div
                  key={index}
                  className={`feedback-item ${feedbackType(feedback.rating)}`}
                >
                  <div className="feedback-stars">
                    {"★".repeat(feedback.rating)}
                    {"☆".repeat(5 - feedback.rating)}
                  </div>

                  <p>
                    "{feedback.message}" — {feedback.userName}
                  </p>
                </div>
              ))
            )}
          </div>
        </AdminTable>
      </div>
    </div>
  );
}

export default AdminDashboard;