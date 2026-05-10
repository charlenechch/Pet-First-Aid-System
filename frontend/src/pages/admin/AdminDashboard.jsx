import AdminCard from "../../components/admin/AdminCard";
import AdminTable from "../../components/admin/AdminTable";
import {
  adminStats,
  recentRegistrations,
  recentFeedback,
} from "../../data/adminData";
import "../../styles/admin.css";
import "../../styles/adminDashboard.css";

function AdminDashboard() {
  return (
    <div className="admin-page">
      <div className="page-title-area">
        <p className="page-subtitle">Welcome back, Admin</p>
        <h1>Admin Overview</h1>
      </div>

      <div className="stats-grid">
        {adminStats.map((stat, index) => (
          <AdminCard
            key={index}
            icon={stat.icon}
            value={stat.value}
            title={stat.title}
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
                {recentRegistrations.map((user, index) => (
                  <tr key={index}>
                    <td>
                      <strong className="cell-title">{user.name}</strong>
                    </td>

                    <td>{user.joined}</td>

                    <td>
                      <span className="status-badge">{user.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AdminTable>

        <AdminTable title="Recent Feedback">
          <div className="feedback-list">
            {recentFeedback.map((feedback, index) => (
              <div key={index} className={`feedback-item ${feedback.type}`}>
                <div className="feedback-stars">
                  {"★".repeat(feedback.rating)}
                  {"☆".repeat(5 - feedback.rating)}
                </div>

                <p>
                  "{feedback.message}" — {feedback.user}
                </p>
              </div>
            ))}
          </div>
        </AdminTable>
      </div>
    </div>
  );
}

export default AdminDashboard;