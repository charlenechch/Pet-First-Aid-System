import { useEffect, useState } from "react";
import "../../styles/admin.css";
import "../../styles/adminProfile.css";

const API_URL = import.meta.env.VITE_API_URL;

function getInitials(name = "") {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

function formatDate(dateString) {
  if (!dateString) return "—";
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

function AdminProfile() {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [adminProfile, setAdminProfile] = useState(null);
  const [profileForm, setProfileForm] = useState({ name: "", email: "", phone_no: "", bio: "" });
  const [avatarPreview, setAvatarPreview] = useState("");
  const [avatarFileName, setAvatarFileName] = useState("");
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });

  const token = localStorage.getItem("token");

  // ── Fetch profile ─────────────────────────────────────────
  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch(`${API_URL}/api/profile/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to load profile.");
        const data = await res.json();
        setAdminProfile(data.user);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  // ── Edit profile ──────────────────────────────────────────
  function openEditModal() {
    setProfileForm({ name: adminProfile.name, email: adminProfile.email, phone_no: adminProfile.phone_no || "", bio: adminProfile.bio || "" });
    setIsEditModalOpen(true);
  }

  async function handleProfileSubmit(event) {
    event.preventDefault();
    if (!profileForm.name.trim()) { alert("Please enter your name."); return; }
    if (!profileForm.email.trim()) { alert("Please enter your email."); return; }
    try {
      const res = await fetch(`${API_URL}/api/profile/me`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(profileForm),
      });
      if (!res.ok) { const d = await res.json(); alert(d.message || "Failed to update profile."); return; }
      setAdminProfile((prev) => ({ ...prev, ...profileForm }));
      // Update localStorage user too
     const stored = JSON.parse(localStorage.getItem("user") || "{}");

localStorage.setItem(
  "user",
  JSON.stringify({
    ...stored,
    name: profileForm.name,
    email: profileForm.email,
    phone_no: profileForm.phone_no,
    bio: profileForm.bio,
  })
);

window.dispatchEvent(new Event("userUpdated"));

setIsEditModalOpen(false);
    } catch { alert("Server error."); }
  }

  // ── Avatar ────────────────────────────────────────────────
  function openAvatarModal() {
    setAvatarPreview(adminProfile.avatarUrl || "");
    setAvatarFileName("");
    setIsAvatarModalOpen(true);
  }

  function handleAvatarChange(event) {
    const file = event.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { alert("Please select an image file."); return; }
    if (file.size > 2 * 1024 * 1024) { alert("Image size should be less than 2MB."); return; }
    const reader = new FileReader();
    reader.onloadend = () => { setAvatarPreview(reader.result); setAvatarFileName(file.name); };
    reader.readAsDataURL(file);
  }

async function saveAvatar() {
  try {
    const res = await fetch(`${API_URL}/api/profile/avatar`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        avatarUrl: avatarPreview,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message || "Failed to update avatar.");
      return;
    }

    setAdminProfile(data.user);

    const stored = JSON.parse(localStorage.getItem("user") || "{}");
    localStorage.setItem("user", JSON.stringify({ ...stored, avatarUrl: data.user.avatarUrl }));
    window.dispatchEvent(new Event("userUpdated"));

    setIsAvatarModalOpen(false);
  } catch (error) {
    console.error("Save avatar error:", error);
    alert("Server error.");
  }
}

async function removeAvatar() {
  if (!window.confirm("Remove current avatar?")) return;

  try {
    const res = await fetch(`${API_URL}/api/profile/avatar`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        avatarUrl: "",
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message || "Failed to remove avatar.");
      return;
    }

    setAdminProfile(data.user);
    setAvatarPreview("");

    const stored = JSON.parse(localStorage.getItem("user") || "{}");
    localStorage.setItem("user", JSON.stringify({ ...stored, avatarUrl: "" }));
    window.dispatchEvent(new Event("userUpdated"));

    setIsAvatarModalOpen(false);
  } catch (error) {
    console.error("Remove avatar error:", error);
    alert("Server error.");
  }
}

  // ── Password ──────────────────────────────────────────────
  function openPasswordModal() {
    setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    setIsPasswordModalOpen(true);
  }

  async function handlePasswordSubmit(event) {
    event.preventDefault();
    if (!passwordForm.currentPassword.trim()) { alert("Please enter current password."); return; }
    if (passwordForm.newPassword.length < 8) { alert("New password must be at least 8 characters."); return; }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) { alert("Passwords do not match."); return; }
    try {
      // Backend uses /api/auth/reset-password with email + newPassword + confirmPassword
      const res = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: adminProfile.email, newPassword: passwordForm.newPassword, confirmPassword: passwordForm.confirmPassword }),
      });
      const d = await res.json();
      if (!res.ok) { alert(d.message || "Failed to change password."); return; }
      alert("Password changed successfully.");
      setIsPasswordModalOpen(false);
    } catch { alert("Server error."); }
  }

  // ── Modals ────────────────────────────────────────────────
  function renderEditModal() {
    if (!isEditModalOpen) return null;
    return (
      <div className="modal-backdrop" onClick={() => setIsEditModalOpen(false)}>
        <section className="admin-modal profile-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <div><p className="page-subtitle">Admin Profile</p><h2>Edit Profile</h2></div>
            <button className="modal-close-btn" onClick={() => setIsEditModalOpen(false)}>×</button>
          </div>
          <form onSubmit={handleProfileSubmit} className="admin-form">
            <label>Full Name<input type="text" value={profileForm.name} onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} /></label>
            <label>Email<input type="email" value={profileForm.email} onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })} /></label>
            <label>Phone Number<input type="text" value={profileForm.phone_no} onChange={(e) => setProfileForm({ ...profileForm, phone_no: e.target.value })} /></label>
            <label>Bio<textarea rows="4" value={profileForm.bio} onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })} /></label>
            <div className="form-actions">
              <button type="submit" className="primary-btn">Save Changes</button>
              <button type="button" className="secondary-btn" onClick={() => setIsEditModalOpen(false)}>Cancel</button>
            </div>
          </form>
        </section>
      </div>
    );
  }

  function renderAvatarModal() {
    if (!isAvatarModalOpen) return null;
    return (
      <div className="modal-backdrop" onClick={() => setIsAvatarModalOpen(false)}>
        <section className="admin-modal profile-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <div><p className="page-subtitle">Admin Profile</p><h2>Edit Avatar</h2></div>
            <button className="modal-close-btn" onClick={() => setIsAvatarModalOpen(false)}>×</button>
          </div>
          <div className="avatar-edit-content">
            <div className="avatar-preview">
              {avatarPreview ? <img src={avatarPreview} alt="Avatar preview" /> : <span>{getInitials(adminProfile?.name)}</span>}
            </div>
            <div className="avatar-upload-box">
              <label className="avatar-upload-label">
                Choose Image
                <input type="file" accept="image/*" onChange={handleAvatarChange} />
              </label>
              <p>Upload a square image for best result. Maximum file size: 2MB.</p>
              {avatarFileName && <small className="avatar-file-name">Selected: {avatarFileName}</small>}
            </div>
          </div>
          <div className="form-actions">
            <button type="button" className="primary-btn" onClick={saveAvatar} disabled={!avatarPreview}>Save Avatar</button>
            {adminProfile?.avatarUrl && (<button type="button" className="secondary-btn danger-outline" onClick={removeAvatar}>Remove Avatar</button>)}
            <button type="button" className="secondary-btn" onClick={() => setIsAvatarModalOpen(false)}>Cancel</button>
          </div>
        </section>
      </div>
    );
  }

  function renderPasswordModal() {
    if (!isPasswordModalOpen) return null;
    return (
      <div className="modal-backdrop" onClick={() => setIsPasswordModalOpen(false)}>
        <section className="admin-modal profile-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <div><p className="page-subtitle">Security</p><h2>Change Password</h2></div>
            <button className="modal-close-btn" onClick={() => setIsPasswordModalOpen(false)}>×</button>
          </div>
          <form onSubmit={handlePasswordSubmit} className="admin-form">
            <label>Current Password<input type="password" value={passwordForm.currentPassword} onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} /></label>
            <label>New Password<input type="password" value={passwordForm.newPassword} onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} /></label>
            <label>Confirm New Password<input type="password" value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} /></label>
            <div className="form-actions">
              <button type="submit" className="primary-btn">Change Password</button>
              <button type="button" className="secondary-btn" onClick={() => setIsPasswordModalOpen(false)}>Cancel</button>
            </div>
          </form>
        </section>
      </div>
    );
  }

  if (loading) return <div className="admin-page"><p>Loading…</p></div>;
  if (error) return <div className="admin-page"><p style={{ color: "crimson" }}>{error}</p></div>;

  const initials = getInitials(adminProfile.name);

  return (
    <div className="admin-page shared-profile-page admin-profile-page">
      {renderEditModal()}
      {renderAvatarModal()}
      {renderPasswordModal()}

      <div className="page-title-row">
        <div className="page-title-area">
          <p className="page-subtitle">Admin Account</p>
          <h1>My Profile</h1>
        </div>
      </div>

      <div className="profile-layout">
        <section className="profile-card">
          <div className="profile-cover"></div>
          <div className="profile-main-info">
            <div className="profile-avatar-wrap">
              <div className="profile-avatar">
                {adminProfile.avatarUrl ? <img src={adminProfile.avatarUrl} alt="Admin avatar" /> : initials}
              </div>
              <button type="button" className="profile-avatar-edit-btn" onClick={openAvatarModal}>✎</button>
            </div>
            <div className="profile-name-area">
              <h2>{adminProfile.name}</h2>
              <p>{adminProfile.email}</p>
              <div className="profile-badge-row">
                <span className="role-badge admin-role-badge">{adminProfile.role}</span>
                <span className="status-badge">{adminProfile.status}</span>
              </div>
            </div>
          </div>
          <p className="profile-bio">{adminProfile.bio || "No bio added yet."}</p>
          <div className="profile-action-row">
            <button className="primary-btn" onClick={openEditModal}>Edit Profile</button>
            <button className="secondary-btn" onClick={openPasswordModal}>Change Password</button>
          </div>
        </section>

        <section className="profile-info-card">
          <h2>Account Information</h2>
          <div className="profile-info-grid">
            <div className="profile-info-item"><span>Full Name</span><strong>{adminProfile.name}</strong></div>
            <div className="profile-info-item"><span>Email</span><strong>{adminProfile.email}</strong></div>
            <div className="profile-info-item"><span>Phone</span><strong>{adminProfile.phone_no || "—"}</strong></div>
            <div className="profile-info-item"><span>Role</span><strong>{adminProfile.role}</strong></div>
            <div className="profile-info-item"><span>Joined</span><strong>{formatDate(adminProfile.created_at)}</strong></div>
            <div className="profile-info-item"><span>Last Login</span><strong>{relativeTime(adminProfile.last_login)}</strong></div>
          </div>
        </section>

        <section className="profile-security-card">
          <h2>Security</h2>
          <div className="security-status-box">
            <div><strong>Password</strong><p>Use the button to update your password.</p></div>
            <button className="secondary-btn" onClick={openPasswordModal}>Update</button>
          </div>
          <div className="security-status-box">
            <div><strong>Account Status</strong><p>Your admin account is currently active.</p></div>
            <span className="status-badge">{adminProfile.status}</span>
          </div>
        </section>
      </div>
    </div>
  );
}

export default AdminProfile;