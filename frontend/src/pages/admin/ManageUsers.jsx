import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import "../../styles/admin.css";
import "../../styles/manageUsers.css";
import "../../styles/mgcNotifications.css";

const API_URL = import.meta.env.VITE_API_URL;

function getInitials(name = "") {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function formatDate(dateString) {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function relativeTime(dateString) {
  if (!dateString) return "Never";
  const diff = Math.floor((new Date() - new Date(dateString)) / 1000);
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
  if (diff < 172800) return "Yesterday";
  return `${Math.floor(diff / 86400)} days ago`;
}

// ─────────────────────────────────────────────────────────────
// Toast hook
// ─────────────────────────────────────────────────────────────
function useToast() {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 350);
  }, []);

  const show = useCallback((type, title, message) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, type, title, message, leaving: false }]);
    timers.current[id] = setTimeout(() => dismiss(id), 4000);
    return id;
  }, [dismiss]);

  const toast = useMemo(() => ({
    success: (title, msg) => show("success", title, msg),
    error:   (title, msg) => show("error",   title, msg),
    warning: (title, msg) => show("warning", title, msg),
    info:    (title, msg) => show("info",    title, msg),
  }), [show]);

  return { toasts, dismiss, toast };
}

// ─────────────────────────────────────────────────────────────
// Confirm dialog hook
// ─────────────────────────────────────────────────────────────
function useConfirm() {
  const [dialog, setDialog] = useState(null);
  const resolverRef = useRef(null);

  const confirm = useCallback(({ title, message, confirmLabel = "Confirm", cancelLabel = "Cancel", variant = "danger" }) => {
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setDialog({ title, message, confirmLabel, cancelLabel, variant });
    });
  }, []);

  function handleConfirm() { setDialog(null); resolverRef.current?.(true); }
  function handleCancel()  { setDialog(null); resolverRef.current?.(false); }

  return { dialog, confirm, handleConfirm, handleCancel };
}

// ─────────────────────────────────────────────────────────────
// Toast renderer
// ─────────────────────────────────────────────────────────────
const TOAST_ICONS = { success: "✓", error: "✕", warning: "⚠", info: "ℹ" };

function ToastContainer({ toasts, dismiss }) {
  if (toasts.length === 0) return null;
  return (
    <div className="mgcn-toast-container" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`mgcn-toast mgcn-toast--${t.type}${t.leaving ? " mgcn-toast--leaving" : ""}`} role="alert">
          <span className="mgcn-toast__icon">{TOAST_ICONS[t.type]}</span>
          <div className="mgcn-toast__body">
            <strong className="mgcn-toast__title">{t.title}</strong>
            {t.message && <p className="mgcn-toast__msg">{t.message}</p>}
          </div>
          <button className="mgcn-toast__close" onClick={() => dismiss(t.id)} aria-label="Dismiss">×</button>
          <span className="mgcn-toast__progress" />
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Confirm dialog renderer
// ─────────────────────────────────────────────────────────────
const CONFIRM_ICONS = {
  danger:  { emoji: "🚫", bg: "#fff1ee", color: "#b6533f" },
  warning: { emoji: "⚠️", bg: "#fff7df", color: "#7a5a10" },
  info:    { emoji: "✅", bg: "#edf8ee", color: "#2f5f46" },
};

function ConfirmDialog({ dialog, onConfirm, onCancel }) {
  if (!dialog) return null;
  const icon = CONFIRM_ICONS[dialog.variant] || CONFIRM_ICONS.danger;
  return (
    <div className="mgcn-confirm-overlay" onClick={onCancel}>
      <div className="mgcn-confirm-modal" onClick={(e) => e.stopPropagation()} role="alertdialog" aria-modal="true" aria-labelledby="mgcn-confirm-title">
        <div className="mgcn-confirm-icon" style={{ background: icon.bg, color: icon.color }}>{icon.emoji}</div>
        <h2 id="mgcn-confirm-title" className="mgcn-confirm-title">{dialog.title}</h2>
        <p className="mgcn-confirm-msg">{dialog.message}</p>
        <div className="mgcn-confirm-actions">
          <button className="mgcn-confirm-cancel" onClick={onCancel}>{dialog.cancelLabel}</button>
          <button className={`mgcn-confirm-ok mgcn-confirm-ok--${dialog.variant}`} onClick={onConfirm}>{dialog.confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────
function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [actionMenu, setActionMenu] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  const [searchKeyword, setSearchKeyword] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  const token = localStorage.getItem("token");

  const { toasts, dismiss, toast } = useToast();
  const { dialog, confirm, handleConfirm, handleCancel } = useConfirm();

// ── Fetch users ────────────────────────────────────────────
useEffect(() => {
  async function fetchUsers() {
    try {
      const token = localStorage.getItem("token");

      const res = await fetch(`${API_URL}/api/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Failed to load users.");
      }

      const data = await res.json();
      setUsers(data.users);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  fetchUsers();
}, []);

  // ── Stats ──────────────────────────────────────────────────
  const userStats = useMemo(() => ({
    totalUsers:     users.length,
    activeUsers:    users.filter((u) => u.status === "Active").length,
    suspendedUsers: users.filter((u) => u.status === "Inactive").length,
    adminUsers:     users.filter((u) => u.role === "admin").length,
  }), [users]);

  // ── Filter ─────────────────────────────────────────────────
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const keyword = searchKeyword.toLowerCase();
      const matchesSearch =
        user.name?.toLowerCase().includes(keyword) ||
        user.email?.toLowerCase().includes(keyword) ||
        user.role?.toLowerCase().includes(keyword) ||
        user.status?.toLowerCase().includes(keyword);
      const matchesRole   = roleFilter   === "All" || user.role   === roleFilter;
      const matchesStatus = statusFilter === "All" || user.status === statusFilter;
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchKeyword, roleFilter, statusFilter]);

  // ── Status update ──────────────────────────────────────────
  async function updateStatus(id, status) {
    try {
      const res = await fetch(`${API_URL}/api/admin/users/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error("Update failed", data.message || "Failed to update user status.");
        return false;
      }
      setUsers((prev) => prev.map((u) => (u.userID === id ? { ...u, status } : u)));
      if (selectedUser?.userID === id) setSelectedUser((prev) => ({ ...prev, status }));
      return true;
    } catch {
      toast.error("Server error", "Something went wrong. Please try again.");
      return false;
    }
  }

  // ── Suspend ────────────────────────────────────────────────
  async function suspendUser(id) {
    const user = users.find((u) => u.userID === id);
    if (!user) return;

    if (user.role === "admin") {
      toast.warning("Action not allowed", "Admin accounts cannot be suspended.");
      closeActionMenu();
      return;
    }

    closeActionMenu();

    const confirmed = await confirm({
      title: "Suspend User",
      message: `Suspend "${user.name}"? They will lose access to their account until reactivated.`,
      confirmLabel: "Yes, Suspend",
      cancelLabel: "Cancel",
      variant: "warning",
    });
    if (!confirmed) return;

    const ok = await updateStatus(id, "Inactive");
    if (ok) toast.success("User suspended", `"${user.name}" has been suspended successfully.`);
  }

  // ── Reactivate ─────────────────────────────────────────────
  async function reactivateUser(id) {
    const user = users.find((u) => u.userID === id);
    closeActionMenu();

    const confirmed = await confirm({
      title: "Reactivate User",
      message: `Reactivate "${user?.name}"? They will regain full access to their account.`,
      confirmLabel: "Yes, Reactivate",
      cancelLabel: "Cancel",
      variant: "info",
    });
    if (!confirmed) return;

    const ok = await updateStatus(id, "Active");
    if (ok) toast.success("User reactivated", `"${user?.name}" now has full access again.`);
  }

  // ── Action menu ────────────────────────────────────────────
  function openActionMenu(event, id) {
    const rect = event.currentTarget.getBoundingClientRect();
    const menuWidth = 180; const gap = 10;
    const hasSpaceRight = window.innerWidth - rect.right > menuWidth + gap;
    const left = hasSpaceRight ? rect.right + gap : Math.max(12, rect.left - menuWidth - gap);
    const top = Math.min(rect.top, window.innerHeight - 230);
    setActionMenu({ id, left, top });
  }
  function closeActionMenu() { setActionMenu(null); }

  function getRoleClass(role) {
    return role === "admin" ? "role-badge admin-role-badge" : "role-badge pet-owner-role-badge";
  }
  function getRoleLabel(role) {
    return role === "admin" ? "Admin" : "Pet Owner";
  }

  // ── Render ─────────────────────────────────────────────────
  if (loading) return <div className="admin-page"><p>Loading users…</p></div>;
  if (error)   return <div className="admin-page"><p style={{ color: "crimson" }}>{error}</p></div>;

  return (
    <div className="admin-page">
      <ToastContainer toasts={toasts} dismiss={dismiss} />
      <ConfirmDialog dialog={dialog} onConfirm={handleConfirm} onCancel={handleCancel} />

      {/* Floating action menu */}
      {actionMenu && (() => {
        const user = users.find((u) => u.userID === actionMenu.id);
        if (!user) return null;
        return (
          <>
            <div className="floating-menu-backdrop" onClick={closeActionMenu} />
            <div className="floating-action-menu" style={{ left: `${actionMenu.left}px`, top: `${actionMenu.top}px` }}>
              <button onClick={() => { setSelectedUser(user); closeActionMenu(); }}>View Details</button>
              {user.role !== "admin" ? (
                user.status === "Active" ? (
                  <button className="danger-text" onClick={() => suspendUser(user.userID)}>Suspend</button>
                ) : (
                  <button onClick={() => reactivateUser(user.userID)}>Reactivate</button>
                )
              ) : (
                <button disabled className="disabled-menu-btn">Admin cannot be suspended</button>
              )}
            </div>
          </>
        );
      })()}

      {/* User details modal */}
      {selectedUser && (
        <div className="modal-backdrop" onClick={() => setSelectedUser(null)}>
          <section className="admin-modal user-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <p className="page-subtitle">User Details</p>
                <h2>{selectedUser.name}</h2>
              </div>
              <button className="modal-close-btn" onClick={() => setSelectedUser(null)}>×</button>
            </div>

            <div className="user-detail-profile">
              <div className="user-detail-avatar">{getInitials(selectedUser.name)}</div>
              <div>
                <h3>{selectedUser.name}</h3>
                <p>{selectedUser.email}</p>
                <span className={getRoleClass(selectedUser.role)}>{getRoleLabel(selectedUser.role)}</span>
              </div>
            </div>

            <div className="user-detail-grid">
              <div className="user-detail-item">
                <span>Status</span>
                <strong>{selectedUser.status}</strong>
              </div>
              <div className="user-detail-item">
                <span>Phone</span>
                <strong>{selectedUser.phone_no || "N/A"}</strong>
              </div>
              <div className="user-detail-item">
                <span>Joined</span>
                <strong>{formatDate(selectedUser.created_at)}</strong>
              </div>
              <div className="user-detail-item">
                <span>Last Active</span>
                <strong>{relativeTime(selectedUser.last_login)}</strong>
              </div>
            </div>

            <div className="form-actions">
              {selectedUser.role === "admin" ? (
                <button type="button" className="secondary-btn" disabled>
                  Admin account cannot be suspended
                </button>
              ) : selectedUser.status === "Active" ? (
                <button className="secondary-btn danger-outline" onClick={() => suspendUser(selectedUser.userID)}>
                  Suspend User
                </button>
              ) : (
                <button className="primary-btn" onClick={() => reactivateUser(selectedUser.userID)}>
                  Reactivate User
                </button>
              )}
            </div>
          </section>
        </div>
      )}

      <div className="page-title-row">
        <div className="page-title-area">
          <p className="page-subtitle">Admin Management</p>
          <h1>Manage Users</h1>
        </div>
      </div>

      <div className="user-stats-grid">
        <div className="user-stat-card"><span>Total Users</span><strong>{userStats.totalUsers}</strong></div>
        <div className="user-stat-card"><span>Active Users</span><strong>{userStats.activeUsers}</strong></div>
        <div className="user-stat-card"><span>Suspended Users</span><strong>{userStats.suspendedUsers}</strong></div>
        <div className="user-stat-card"><span>Admins</span><strong>{userStats.adminUsers}</strong></div>
      </div>

      <section className="admin-table-card">
        <div className="table-header-row">
          <div>
            <h2>User List</h2>
            <p className="form-note">Pet owner accounts can be suspended or reactivated. Admin accounts cannot be suspended.</p>
          </div>
        </div>

        <div className="filter-row user-filter-row">
          <input type="text" placeholder="Search users by name, email, role, or status..." value={searchKeyword} onChange={(e) => setSearchKeyword(e.target.value)} />
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
            <option value="All">All Roles</option>
            <option value="pet_owner">Pet Owner</option>
            <option value="admin">Admin</option>
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Suspended</option>
          </select>
        </div>

        <p className="table-scroll-note">Scroll sideways to view more columns on smaller screens.</p>

        <div className="table-responsive">
          <table className="admin-table users-table">
            <thead>
              <tr>
                <th>User</th><th>Email</th><th>Role</th><th>Joined</th><th>Status</th><th>Last Active</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length > 0 ? filteredUsers.map((user) => (
                <tr key={user.userID}>
                  <td>
                    <div className="user-cell">
                      <div className="user-avatar">{getInitials(user.name)}</div>
                      <div>
                        <strong className="cell-title">{user.name}</strong>
                        <p className="table-small-text">{user.phone_no || ""}</p>
                      </div>
                    </div>
                  </td>
                  <td><span className="long-table-text">{user.email}</span></td>
                  <td><span className={getRoleClass(user.role)}>{getRoleLabel(user.role)}</span></td>
                  <td>{formatDate(user.created_at)}</td>
                  <td>
                    <span className={user.status === "Active" ? "status-badge" : "status-badge suspended"}>
                      {user.status === "Inactive" ? "Suspended" : user.status}
                    </span>
                  </td>
                  <td>{relativeTime(user.last_login)}</td>
                  <td><button className="three-dot-btn" onClick={(e) => openActionMenu(e, user.userID)}>⋯</button></td>
                </tr>
              )) : (
                <tr><td colSpan="7" className="empty-table-text">No users found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default ManageUsers;