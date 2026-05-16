import { useState } from "react";
import { petOwnerProfile as initialProfile } from "../../data/petOwnerData";
import "../../styles/admin.css";
import "../../styles/petOwner.css";

function Profile() {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  const [profile, setProfile] = useState(initialProfile);
  const [profileForm, setProfileForm] = useState(initialProfile);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  function getInitials(name) {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }

  function openEditModal() {
    setProfileForm(profile);
    setIsEditModalOpen(true);
  }

  function closeEditModal() {
    setIsEditModalOpen(false);
  }

  function handleProfileSubmit(event) {
    event.preventDefault();

    if (!profileForm.name.trim()) {
      alert("Please enter your name.");
      return;
    }

    if (!profileForm.email.trim()) {
      alert("Please enter your email.");
      return;
    }

    setProfile({
      ...profileForm,
      initials: getInitials(profileForm.name),
    });

    setIsEditModalOpen(false);
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
      alert("New password and confirmation do not match.");
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
              <p className="page-subtitle">My Account</p>
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
    <div className="admin-page">
      {renderEditModal()}
      {renderPasswordModal()}

      <div className="page-title-row">
        <div className="page-title-area">
          <p className="page-subtitle">Pet Owner Account</p>
          <h1>My Profile</h1>
        </div>
      </div>

      <div className="profile-layout">
        <section className="profile-card">
          <div className="profile-cover"></div>

          <div className="profile-main-info">
            <div className="profile-avatar-wrap">
              <div className="profile-avatar">
                {profile.avatarUrl ? (
                  <img src={profile.avatarUrl} alt="Profile avatar" />
                ) : (
                  profile.initials
                )}
              </div>
            </div>

            <div className="profile-name-area">
              <h2>{profile.name}</h2>
              <p>{profile.email}</p>

              <div className="profile-badge-row">
                <span className="role-badge">{profile.role}</span>
                <span className="status-badge">{profile.status}</span>
              </div>
            </div>
          </div>

          <p className="profile-bio">{profile.bio}</p>

          <div className="profile-pets-row">
            {profile.pets.map((pet) => (
              <span key={pet.id} className="profile-pet-pill">
                {pet.emoji} {pet.name} · {pet.type}
              </span>
            ))}
          </div>

          <div className="profile-action-row" style={{ marginTop: "22px" }}>
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
              <strong>{profile.name}</strong>
            </div>

            <div className="profile-info-item">
              <span>Email</span>
              <strong>{profile.email}</strong>
            </div>

            <div className="profile-info-item">
              <span>Phone</span>
              <strong>{profile.phone}</strong>
            </div>

            <div className="profile-info-item">
              <span>Role</span>
              <strong>{profile.role}</strong>
            </div>

            <div className="profile-info-item">
              <span>Joined</span>
              <strong>{profile.joined}</strong>
            </div>

            <div className="profile-info-item">
              <span>Last Login</span>
              <strong>{profile.lastLogin}</strong>
            </div>
          </div>
        </section>

        <section className="profile-security-card">
          <h2>Security</h2>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "16px 18px",
              border: "1px solid #e5e2dc",
              borderRadius: "14px",
              marginBottom: "12px",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >
            <div>
              <strong>Password</strong>
              <p style={{ margin: "4px 0 0", color: "#6f7c73" }}>
                Update your password regularly to keep your account safe.
              </p>
            </div>

            <button className="secondary-btn" onClick={openPasswordModal}>
              Update
            </button>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "16px 18px",
              border: "1px solid #e5e2dc",
              borderRadius: "14px",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >
            <div>
              <strong>Account Status</strong>
              <p style={{ margin: "4px 0 0", color: "#6f7c73" }}>
                Your pet owner account is currently active.
              </p>
            </div>

            <span className="status-badge">{profile.status}</span>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Profile;
