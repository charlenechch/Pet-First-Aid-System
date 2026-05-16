import { Link } from "react-router-dom";
import AdminCard from "../../components/admin/AdminCard";
import {
  petOwnerProfile,
  dashboardStats,
  recentTopics,
  recentQuizAttempts,
} from "../../data/petOwnerData";
import "../../styles/admin.css";
import "../../styles/petOwner.css";

function PetOwnerDashboard() {
  return (
    <div className="admin-page">
      <div className="petowner-hero">
        <div className="petowner-hero-text">
          <p className="page-subtitle">Welcome back</p>
          <h2>Hi {petOwnerProfile.name.split(" ")[0]} 👋</h2>
          <p>
            Stay prepared for any pet emergency. Review your saved topics,
            attempt quizzes, and keep your knowledge up to date.
          </p>
        </div>

        <div className="petowner-hero-pets">
          {petOwnerProfile.pets.map((pet) => (
            <span key={pet.id} className="petowner-hero-pet-pill">
              {pet.emoji} {pet.name}
            </span>
          ))}
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
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default PetOwnerDashboard;
