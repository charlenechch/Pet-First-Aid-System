import "../../styles/admin.css";

function AdminTable({ title, children }) {
  return (
    <section className="admin-table-card">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

export default AdminTable;