import { useMemo, useState } from "react";
import "../../styles/admin.css";
import "../../styles/manageUsers.css";

function ManageUsers() {
  const [actionMenu, setActionMenu] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  const [searchKeyword, setSearchKeyword] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  const [users, setUsers] = useState([
    {
      id: 1,
      name: "Jane Smith",
      initials: "JS",
      email: "jane@example.com",
      role: "Pet Owner",
      joined: "1 Jan 2026",
      status: "Active",
      pets: ["Dog", "Cat"],
      feedbackCount: 3,
      quizAttempts: 5,
      lastActive: "2 hours ago",
    },
    {
      id: 2,
      name: "Mark Lim",
      initials: "ML",
      email: "mark@example.com",
      role: "Pet Owner",
      joined: "15 Jan 2026",
      status: "Active",
      pets: ["Dog"],
      feedbackCount: 1,
      quizAttempts: 2,
      lastActive: "Yesterday",
    },
    {
      id: 3,
      name: "Aisha Rahman",
      initials: "AR",
      email: "aisha@example.com",
      role: "Admin",
      joined: "1 Jan 2026",
      status: "Active",
      pets: [],
      feedbackCount: 0,
      quizAttempts: 0,
      lastActive: "Today",
    },
    {
      id: 4,
      name: "Daniel Wong",
      initials: "DW",
      email: "daniel@example.com",
      role: "Pet Owner",
      joined: "22 Jan 2026",
      status: "Suspended",
      pets: ["Bird"],
      feedbackCount: 2,
      quizAttempts: 1,
      lastActive: "4 days ago",
    },
  ]);

  const userStats = useMemo(() => {
    const totalUsers = users.length;

    const activeUsers = users.filter(
      (user) => user.status === "Active"
    ).length;

    const suspendedUsers = users.filter(
      (user) => user.status === "Suspended"
    ).length;

    const adminUsers = users.filter((user) => user.role === "Admin").length;

    return {
      totalUsers,
      activeUsers,
      suspendedUsers,
      adminUsers,
    };
  }, [users]);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const keyword = searchKeyword.toLowerCase();

      const matchesSearch =
        user.name.toLowerCase().includes(keyword) ||
        user.email.toLowerCase().includes(keyword) ||
        user.role.toLowerCase().includes(keyword) ||
        user.status.toLowerCase().includes(keyword);

      const matchesRole = roleFilter === "All" || user.role === roleFilter;

      const matchesStatus =
        statusFilter === "All" || user.status === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchKeyword, roleFilter, statusFilter]);

  function openActionMenu(event, id) {
    const rect = event.currentTarget.getBoundingClientRect();
    const menuWidth = 180;
    const gap = 10;

    const hasSpaceRight = window.innerWidth - rect.right > menuWidth + gap;

    const left = hasSpaceRight
      ? rect.right + gap
      : Math.max(12, rect.left - menuWidth - gap);

    const top = Math.min(rect.top, window.innerHeight - 230);

    setActionMenu({
      id,
      left,
      top,
    });
  }

  function closeActionMenu() {
    setActionMenu(null);
  }

  function updateUserStatus(id, status) {
    setUsers((prevUsers) =>
      prevUsers.map((user) =>
        user.id === id ? { ...user, status } : user
      )
    );
  }

  function suspendUser(id) {
    const user = users.find((item) => item.id === id);

    if (!user) return;

    if (user.role === "Admin") {
      alert("Admin accounts cannot be suspended.");
      return;
    }

    const confirmSuspend = window.confirm(
      "Are you sure you want to suspend this user?"
    );

    if (!confirmSuspend) return;

    updateUserStatus(id, "Suspended");
  }

  function reactivateUser(id) {
    updateUserStatus(id, "Active");
  }

  function getRoleClass(role) {
    if (role === "Admin") {
      return "role-badge admin-role-badge";
    }

    return "role-badge pet-owner-role-badge";
  }

  function renderActionMenu() {
    if (!actionMenu) return null;

    const user = users.find((item) => item.id === actionMenu.id);

    if (!user) return null;

    return (
      <>
        <div className="floating-menu-backdrop" onClick={closeActionMenu} />

        <div
          className="floating-action-menu"
          style={{
            left: `${actionMenu.left}px`,
            top: `${actionMenu.top}px`,
          }}
        >
          <button
            onClick={() => {
              setSelectedUser(user);
              closeActionMenu();
            }}
          >
            View Details
          </button>

          {user.role !== "Admin" && (
            <>
              {user.status === "Active" ? (
                <button
                  className="danger-text"
                  onClick={() => {
                    suspendUser(user.id);
                    closeActionMenu();
                  }}
                >
                  Suspend
                </button>
              ) : (
                <button
                  onClick={() => {
                    reactivateUser(user.id);
                    closeActionMenu();
                  }}
                >
                  Reactivate
                </button>
              )}
            </>
          )}

          {user.role === "Admin" && (
            <button disabled className="disabled-menu-btn">
              Admin cannot be suspended
            </button>
          )}
        </div>
      </>
    );
  }

  function renderUserDetailsModal() {
    if (!selectedUser) return null;

    return (
      <div className="modal-backdrop" onClick={() => setSelectedUser(null)}>
        <section
          className="admin-modal user-detail-modal"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="modal-header">
            <div>
              <p className="page-subtitle">User Details</p>
              <h2>{selectedUser.name}</h2>
            </div>

            <button
              className="modal-close-btn"
              onClick={() => setSelectedUser(null)}
            >
              ×
            </button>
          </div>

          <div className="user-detail-profile">
            <div className="user-detail-avatar">{selectedUser.initials}</div>

            <div>
              <h3>{selectedUser.name}</h3>
              <p>{selectedUser.email}</p>

              <span className={getRoleClass(selectedUser.role)}>
                {selectedUser.role}
              </span>
            </div>
          </div>

          <div className="user-detail-grid">
            <div className="user-detail-item">
              <span>Status</span>
              <strong>{selectedUser.status}</strong>
            </div>

            <div className="user-detail-item">
              <span>Joined</span>
              <strong>{selectedUser.joined}</strong>
            </div>

            <div className="user-detail-item">
              <span>Last Active</span>
              <strong>{selectedUser.lastActive}</strong>
            </div>

            <div className="user-detail-item">
              <span>Pets</span>
              <strong>
                {selectedUser.pets.length > 0
                  ? selectedUser.pets.join(", ")
                  : "N/A"}
              </strong>
            </div>

            <div className="user-detail-item">
              <span>Feedback Submitted</span>
              <strong>{selectedUser.feedbackCount}</strong>
            </div>

            <div className="user-detail-item">
              <span>Quiz Attempts</span>
              <strong>{selectedUser.quizAttempts}</strong>
            </div>
          </div>

          <div className="form-actions">
            {selectedUser.role === "Admin" ? (
              <button type="button" className="secondary-btn" disabled>
                Admin account cannot be suspended
              </button>
            ) : selectedUser.status === "Active" ? (
              <button
                className="secondary-btn danger-outline"
                onClick={() => {
                  suspendUser(selectedUser.id);

                  setSelectedUser({
                    ...selectedUser,
                    status: "Suspended",
                  });
                }}
              >
                Suspend User
              </button>
            ) : (
              <button
                className="primary-btn"
                onClick={() => {
                  reactivateUser(selectedUser.id);

                  setSelectedUser({
                    ...selectedUser,
                    status: "Active",
                  });
                }}
              >
                Reactivate User
              </button>
            )}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="admin-page">
      {renderActionMenu()}
      {renderUserDetailsModal()}

      <div className="page-title-row">
        <div className="page-title-area">
          <p className="page-subtitle">Admin Management</p>
          <h1>Manage Users</h1>
        </div>
      </div>

      <div className="user-stats-grid">
        <div className="user-stat-card">
          <span>Total Users</span>
          <strong>{userStats.totalUsers}</strong>
        </div>

        <div className="user-stat-card">
          <span>Active Users</span>
          <strong>{userStats.activeUsers}</strong>
        </div>

        <div className="user-stat-card">
          <span>Suspended Users</span>
          <strong>{userStats.suspendedUsers}</strong>
        </div>

        <div className="user-stat-card">
          <span>Admins</span>
          <strong>{userStats.adminUsers}</strong>
        </div>
      </div>

      <section className="admin-table-card">
        <div className="table-header-row">
          <div>
            <h2>User List</h2>
            <p className="form-note">
              Pet owner accounts can be suspended or reactivated. Admin accounts
              cannot be suspended.
            </p>
          </div>
        </div>

        <div className="filter-row user-filter-row">
          <input
            type="text"
            placeholder="Search users by name, email, role, or status..."
            value={searchKeyword}
            onChange={(event) => setSearchKeyword(event.target.value)}
          />

          <select
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value)}
          >
            <option value="All">All Roles</option>
            <option value="Pet Owner">Pet Owner</option>
            <option value="Admin">Admin</option>
          </select>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="Suspended">Suspended</option>
          </select>
        </div>

        <p className="table-scroll-note">
          Scroll sideways to view more columns on smaller screens.
        </p>

        <div className="table-responsive">
          <table className="admin-table users-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Role</th>
                <th>Joined</th>
                <th>Status</th>
                <th>Feedback</th>
                <th>Quiz</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className="user-cell">
                        <div className="user-avatar">{user.initials}</div>

                        <div>
                          <strong className="cell-title">{user.name}</strong>
                          <p className="table-small-text">
                            Last active: {user.lastActive}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td>
                      <span className="long-table-text">{user.email}</span>
                    </td>

                    <td>
                      <span className={getRoleClass(user.role)}>
                        {user.role}
                      </span>
                    </td>

                    <td>{user.joined}</td>

                    <td>
                      <span
                        className={
                          user.status === "Active"
                            ? "status-badge"
                            : "status-badge suspended"
                        }
                      >
                        {user.status}
                      </span>
                    </td>

                    <td>{user.feedbackCount}</td>

                    <td>{user.quizAttempts}</td>

                    <td>
                      <button
                        className="three-dot-btn"
                        onClick={(event) => openActionMenu(event, user.id)}
                      >
                        ⋯
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="empty-table-text">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default ManageUsers;