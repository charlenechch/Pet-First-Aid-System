import "../../styles/admin.css";

function AdminCard({ icon, value, title }) {
  return (
    <div className="admin-stat-card">
      <div className="stat-icon">{icon}</div>
      <h3>{value}</h3>
      <p>{title}</p>
    </div>
  );
}

export default AdminCard;