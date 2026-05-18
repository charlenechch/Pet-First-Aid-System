import { useState } from "react";
import "../../styles/admin.css";
import "../../styles/adminProfile.css";

function AdminProfile() {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);

  const [adminProfile, setAdminProfile] = useState({
    name: "Aisha Rahman",
    initials: "AR",
    email: "aisha@example.com",
    role: "Admin",
    status: "Active",
    phone: "+60 12-345 6789",
    joined: "1 Jan 2026",
    lastLogin: "Today, 9:30 AM",
    bio: "Responsible for managing PawGuard content, users, feedback, and emergency guide updates.",
    avatarUrl: "",
  });

  const [profileForm, setProfileForm] = useState(adminProfile);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [avatarFileName, setAvatarFileName] = useState("");

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const recentActivities = [
    {
      id: 1,
      action: "Updated Choking & Airway Blockage guide",
      time: "2 hours ago",
      type: "Guide Content",
    },
    {
      id: 2,
      action: "Marked feedback from Jane Smith as reviewed",
      time: "Yesterday",
      type: "Feedback",
    },
    {
      id: 3,
      action: "Archived Cat poisoning topic",
      time: "2 days ago",
      type: "Pet & Topics",
    },
    {
      id: 4,
      action: "Reviewed user account status",
      time: "3 days ago",
      type: "Users",
    },
  ];

  function getInitials(name) {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }

  function openEditModal() {
    setProfileForm(adminProfile);
    setIsEditModalOpen(true);
  }

  function closeEditModal() {
    setIsEditModalOpen(false);
  }

  function handleProfileSubmit(event) {
    event.preventDefault();

    if (!profileForm.name.trim()) {
      alert("Please enter admin name.");
      return;
    }

    if (!profileForm.email.trim()) {
      alert("Please enter admin email.");
      return;
    }

    setAdminProfile({
      ...profileForm,
      initials: getInitials(profileForm.name),
    });

    setIsEditModalOpen(false);
  }

  function openAvatarModal() {
    setAvatarPreview(adminProfile.avatarUrl || "");
    setAvatarFileName("");
    setIsAvatarModalOpen(true);
  }

  function closeAvatarModal() {
    setIsAvatarModalOpen(false);
    setAvatarPreview("");
    setAvatarFileName("");
  }

  function handleAvatarChange(event) {
    const file = event.target.files[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");
      return;
    }

    const maxSizeInMB = 2;
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024;

    if (file.size > maxSizeInBytes) {
      alert("Image size should be less than 2MB.");
      return;
    }

    const reader = new FileReader();

    reader.onloadend = () => {
      setAvatarPreview(reader.result);
      setAvatarFileName(file.name);
    };

    reader.readAsDataURL(file);
  }

  function saveAvatar() {
    setAdminProfile((prevProfile) => ({
      ...prevProfile,
      avatarUrl: avatarPreview,
    }));

    closeAvatarModal();
  }

  function removeAvatar() {
    const confirmRemove = window.confirm("Remove current avatar?");

    if (!confirmRemove) return;

    setAdminProfile((prevProfile) => ({
      ...prevProfile,
      avatarUrl: "",
    }));

    setAvatarPreview("");
    setAvatarFileName("");
    setIsAvatarModalOpen(false);
  }

  function openPasswordModal() {
    setPasswordForm({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });

    setIsPasswordModalOpen(true);
  }

  function closePasswordModal() {
    setIsPasswordModalOpen(false);
  }

  function handlePasswordSubmit(event) {
    event.preventDefault();

    if (!passwordForm.currentPassword.trim()) {
      alert("Please enter current password.");
      return;
    }

    if (!passwordForm.newPassword.trim()) {
      alert("Please enter new password.");
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      alert("New password should be at least 8 characters.");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert("New password and confirmation password do not match.");
      return;
    }

    alert("Password changed successfully. This is hardcoded for now.");
    setIsPasswordModalOpen(false);
  }

  function renderEditModal() {
    if (!isEditModalOpen) return null;

    return (
      <div className="modal-backdrop" onClick={closeEditModal}>
        <section
          className="admin-modal profile-modal"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="modal-header">
            <div>
              <p className="page-subtitle">Admin Profile</p>
              <h2>Edit Profile</h2>
            </div>

            <button className="modal-close-btn" onClick={closeEditModal}>
              ×
            </button>
          </div>

          <form onSubmit={handleProfileSubmit} className="admin-form">
            <label>
              Full Name
              <input
                type="text"
                value={profileForm.name}
                onChange={(event) =>
                  setProfileForm({
                    ...profileForm,
                    name: event.target.value,
                  })
                }
              />
            </label>

            <label>
              Email
              <input
                type="email"
                value={profileForm.email}
                onChange={(event) =>
                  setProfileForm({
                    ...profileForm,
                    email: event.target.value,
                  })
                }
              />
            </label>

            <label>
              Phone Number
              <input
                type="text"
                value={profileForm.phone}
                onChange={(event) =>
                  setProfileForm({
                    ...profileForm,
                    phone: event.target.value,
                  })
                }
              />
            </label>

            <label>
              Bio
              <textarea
                rows="4"
                value={profileForm.bio}
                onChange={(event) =>
                  setProfileForm({
                    ...profileForm,
                    bio: event.target.value,
                  })
                }
              />
            </label>

            <div className="form-actions">
              <button type="submit" className="primary-btn">
                Save Changes
              </button>

              <button
                type="button"
                className="secondary-btn"
                onClick={closeEditModal}
              >
                Cancel
              </button>
            </div>
          </form>
        </section>
      </div>
    );
  }

  function renderAvatarModal() {
    if (!isAvatarModalOpen) return null;

    return (
      <div className="modal-backdrop" onClick={closeAvatarModal}>
        <section
          className="admin-modal profile-modal"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="modal-header">
            <div>
              <p className="page-subtitle">Admin Profile</p>
              <h2>Edit Avatar</h2>
            </div>

            <button className="modal-close-btn" onClick={closeAvatarModal}>
              ×
            </button>
          </div>

          <div className="avatar-edit-content">
            <div className="avatar-preview">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar preview" />
              ) : (
                <span>{adminProfile.initials}</span>
              )}
            </div>

            <div className="avatar-upload-box">
              <label className="avatar-upload-label">
                Choose Image
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                />
              </label>

              <p>
                Upload a square image for best result. Maximum file size: 2MB.
              </p>

              {avatarFileName && (
                <small className="avatar-file-name">
                  Selected: {avatarFileName}
                </small>
              )}
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="primary-btn"
              onClick={saveAvatar}
              disabled={!avatarPreview}
            >
              Save Avatar
            </button>

            {adminProfile.avatarUrl && (
              <button
                type="button"
                className="secondary-btn danger-outline"
                onClick={removeAvatar}
              >
                Remove Avatar
              </button>
            )}

            <button
              type="button"
              className="secondary-btn"
              onClick={closeAvatarModal}
            >
              Cancel
            </button>
          </div>
        </section>
      </div>
    );
  }

  function renderPasswordModal() {
    if (!isPasswordModalOpen) return null;

    return (
      <div className="modal-backdrop" onClick={closePasswordModal}>
        <section
          className="admin-modal profile-modal"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="modal-header">
            <div>
              <p className="page-subtitle">Security</p>
              <h2>Change Password</h2>
            </div>

            <button className="modal-close-btn" onClick={closePasswordModal}>
              ×
            </button>
          </div>

          <form onSubmit={handlePasswordSubmit} className="admin-form">
            <label>
              Current Password
              <input
                type="password"
                value={passwordForm.currentPassword}
                onChange={(event) =>
                  setPasswordForm({
                    ...passwordForm,
                    currentPassword: event.target.value,
                  })
                }
              />
            </label>

            <label>
              New Password
              <input
                type="password"
                value={passwordForm.newPassword}
                onChange={(event) =>
                  setPasswordForm({
                    ...passwordForm,
                    newPassword: event.target.value,
                  })
                }
              />
            </label>

            <label>
              Confirm New Password
              <input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(event) =>
                  setPasswordForm({
                    ...passwordForm,
                    confirmPassword: event.target.value,
                  })
                }
              />
            </label>

            <p className="profile-security-note">
              This is hardcoded for now. Later, connect this to your backend API
              for real password verification.
            </p>

            <div className="form-actions">
              <button type="submit" className="primary-btn">
                Change Password
              </button>

              <button
                type="button"
                className="secondary-btn"
                onClick={closePasswordModal}
              >
                Cancel
              </button>
            </div>
          </form>
        </section>
      </div>
    );
  }

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
                {adminProfile.avatarUrl ? (
                  <img src={adminProfile.avatarUrl} alt="Admin avatar" />
                ) : (
                  adminProfile.initials
                )}
              </div>

              <button
                type="button"
                className="profile-avatar-edit-btn"
                onClick={openAvatarModal}
              >
                ✎
              </button>
            </div>

            <div className="profile-name-area">
              <h2>{adminProfile.name}</h2>
              <p>{adminProfile.email}</p>

              <div className="profile-badge-row">
                <span className="role-badge admin-role-badge">
                  {adminProfile.role}
                </span>

                <span className="status-badge">{adminProfile.status}</span>
              </div>
            </div>
          </div>

          <p className="profile-bio">{adminProfile.bio}</p>

          <div className="profile-action-row">
            <button className="primary-btn" onClick={openEditModal}>
              Edit Profile
            </button>

            <button className="secondary-btn" onClick={openPasswordModal}>
              Change Password
            </button>
          </div>
        </section>

        <section className="profile-info-card">
          <h2>Account Information</h2>

          <div className="profile-info-grid">
            <div className="profile-info-item">
              <span>Full Name</span>
              <strong>{adminProfile.name}</strong>
            </div>

            <div className="profile-info-item">
              <span>Email</span>
              <strong>{adminProfile.email}</strong>
            </div>

            <div className="profile-info-item">
              <span>Phone</span>
              <strong>{adminProfile.phone}</strong>
            </div>

            <div className="profile-info-item">
              <span>Role</span>
              <strong>{adminProfile.role}</strong>
            </div>

            <div className="profile-info-item">
              <span>Joined</span>
              <strong>{adminProfile.joined}</strong>
            </div>

            <div className="profile-info-item">
              <span>Last Login</span>
              <strong>{adminProfile.lastLogin}</strong>
            </div>
          </div>
        </section>

        <section className="profile-security-card">
          <h2>Security</h2>

          <div className="security-status-box">
            <div>
              <strong>Password</strong>
              <p>Last changed: Not available in hardcoded prototype</p>
            </div>

            <button className="secondary-btn" onClick={openPasswordModal}>
              Update
            </button>
          </div>

          <div className="security-status-box">
            <div>
              <strong>Account Status</strong>
              <p>Your admin account is currently active.</p>
            </div>

            <span className="status-badge">{adminProfile.status}</span>
          </div>
        </section>

        <section className="profile-activity-card">
          <h2>Recent Activity</h2>

          <div className="profile-activity-list">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="profile-activity-item">
                <div className="activity-dot"></div>

                <div>
                  <strong>{activity.action}</strong>
                  <p>
                    {activity.type} · {activity.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export default AdminProfile;