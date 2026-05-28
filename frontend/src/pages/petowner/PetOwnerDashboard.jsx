import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AdminCard from "../../components/admin/AdminCard";
import { apiRequest } from "../../api";
import "../../styles/admin.css";
import "../../styles/petOwner.css";

function PetOwnerDashboard() {
  const [profile, setProfile] = useState({
    name: "Pet Owner",
    email: "",
  });

  const [dashboardStats, setDashboardStats] = useState([]);
  const [recentTopics, setRecentTopics] = useState([]);
  const [recentQuizAttempts, setRecentQuizAttempts] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Load dashboard data from backend database
  useEffect(() => {
    let isCancelled = false;

    async function loadDashboard() {
      try {
        setLoading(true);
        setError("");

        console.log("Loading pet owner dashboard...");

        const data = await apiRequest("/api/petowner/dashboard");

        if (isCancelled) return;

        const profileData = data.profile || {
          name: "Pet Owner",
          email: "",
        };

        const stats = data.stats || {
          totalBookmarks: 0,
          totalQuizzes: 0,
          totalAttempts: 0,
        };

        const formattedStats = [
          {
            icon: "🔖",
            value: stats.totalBookmarks || 0,
            title: "Saved Topics",
          },
          {
            icon: "🧠",
            value: stats.totalQuizzes || 0,
            title: "Available Quizzes",
          },
          {
            icon: "📊",
            value: stats.totalAttempts || 0,
            title: "Quiz Attempts",
          },
        ];

        const formattedTopics = (data.recentTopics || []).map((topic) => ({
          id: topic.emergencyID,
          title: topic.topicTitle,
          pet: topic.petName,
          petEmoji: topic.icon || "🐾",
          severity: topic.severity || "Moderate",
        }));

        const formattedQuizAttempts = (data.recentQuizAttempts || []).map(
          (attempt) => ({
            id: attempt.resultID,
            quizTitle: attempt.quizTitle,
            score: attempt.score,
            result: attempt.passed ? "Passed" : "Failed",
            attemptedAt: attempt.attempted_at
              ? new Date(attempt.attempted_at).toLocaleDateString()
              : "-",
          })
        );

        console.log("Dashboard profile:", profileData);
        console.log("Dashboard stats:", formattedStats);
        console.log("Recent topics:", formattedTopics);
        console.log("Recent quiz attempts:", formattedQuizAttempts);

        setProfile(profileData);
        setDashboardStats(formattedStats);
        setRecentTopics(formattedTopics);
        setRecentQuizAttempts(formattedQuizAttempts);
      } catch (error) {
        if (isCancelled) return;

        console.error("Load dashboard error:", error);
        setError(error.message || "Failed to load dashboard.");
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      isCancelled = true;
    };
  }, []);

  function retryLoadDashboard() {
    window.location.reload();
  }

  const firstName = profile.name
    ? profile.name.split(" ")[0]
    : "Pet Owner";

  if (loading) {
    return (
      <div className="admin-page shared-profile-page petowner-profile-page">
        <div className="petowner-hero">
          <div className="petowner-hero-text">
            <p className="page-subtitle">Welcome back</p>
            <h2>Loading dashboard...</h2>
            <p>Please wait while we load your latest pet first-aid data.</p>
          </div>
        </div>

        <section className="admin-table-card">
          <div className="petowner-empty-state">
            <span className="empty-icon">⏳</span>
            <p>Loading your dashboard...</p>
          </div>
        </section>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-page shared-profile-page petowner-profile-page">
        <div className="petowner-hero">
          <div className="petowner-hero-text">
            <p className="page-subtitle">Welcome back</p>
            <h2>Unable to load dashboard</h2>
            <p>{error}</p>
          </div>
        </div>

        <section className="admin-table-card">
          <div className="petowner-empty-state">
            <span className="empty-icon">⚠️</span>
            <p>{error}</p>

            <button
              className="primary-btn"
              style={{ marginTop: "16px" }}
              onClick={retryLoadDashboard}
            >
              Try Again
            </button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="admin-page shared-profile-page petowner-profile-page">
      <div className="petowner-hero">
        <div className="petowner-hero-text">
          <p className="page-subtitle">Welcome back</p>

          <h2>Hi {firstName} 👋</h2>

          <p>
            Stay prepared for any pet emergency. Review your saved topics,
            attempt quizzes, and keep your knowledge up to date.
          </p>
        </div>

        <div className="petowner-hero-pets">
          <span className="petowner-hero-pet-pill">🐾 Pet Owner</span>
        </div>
      </div>

      <div className="stats-grid">
        {dashboardStats.map((stat, index) => (
          <AdminCard
            key={index}
            icon={stat.icon}
            value={stat.value}
            title={stat.title}
          />
        ))}
      </div>

      <div className="dashboard-grid">
        <section className="admin-table-card">
          <div className="table-header-row">
            <div>
              <h2>Saved Topics</h2>
              <p className="form-note">
                Quick access to your most recently bookmarked emergency topics.
              </p>
            </div>

            <Link to="/petowner/bookmarks" className="secondary-btn">
              View All
            </Link>
          </div>

          {recentTopics.length > 0 ? (
            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Topic</th>
                    <th>Pet</th>
                    <th>Severity</th>
                  </tr>
                </thead>

                <tbody>
                  {recentTopics.map((topic) => (
                    <tr key={topic.id}>
                      <td>
                        <strong className="cell-title">{topic.title}</strong>
                      </td>

                      <td>
                        {topic.petEmoji} {topic.pet}
                      </td>

                      <td>
                        <span
                          className={`severity-badge ${topic.severity.toLowerCase()}`}
                        >
                          {topic.severity}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="petowner-empty-state">
              <span className="empty-icon">🔖</span>
              <p>You have not bookmarked any emergency topics yet.</p>

              <Link
                to="/emergency-search"
                className="primary-btn"
                style={{ marginTop: "16px" }}
              >
                Browse Guides
              </Link>
            </div>
          )}
        </section>

        <section className="admin-table-card">
          <div className="table-header-row">
            <div>
              <h2>Recent Quiz Attempts</h2>

              <p className="form-note">
                Track how you have been doing on your quizzes.
              </p>
            </div>

            <Link to="/petowner/quizzes" className="secondary-btn">
              View Quizzes
            </Link>
          </div>

          {recentQuizAttempts.length > 0 ? (
            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Quiz</th>
                    <th>Score</th>
                    <th>Result</th>
                    <th>Attempted</th>
                  </tr>
                </thead>

                <tbody>
                  {recentQuizAttempts.map((attempt) => (
                    <tr key={attempt.id}>
                      <td>
                        <strong className="cell-title">
                          {attempt.quizTitle}
                        </strong>
                      </td>

                      <td>{attempt.score}%</td>

                      <td>
                        <span
                          className={
                            attempt.result === "Passed"
                              ? "status-badge"
                              : "status-badge draft"
                          }
                        >
                          {attempt.result}
                        </span>
                      </td>

                      <td>{attempt.attemptedAt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="petowner-empty-state">
              <span className="empty-icon">🧠</span>
              <p>You have not attempted any quizzes yet.</p>

              <Link
                to="/petowner/quizzes"
                className="primary-btn"
                style={{ marginTop: "16px" }}
              >
                Start Quiz
              </Link>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default PetOwnerDashboard;