import { useState } from "react";
import {
  petOwnerProfile as initialProfile,
  petTypes,
} from "../../data/petOwnerData";
import "../../styles/admin.css";
import "../../styles/petOwner.css";

function Profile() {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isPetModalOpen, setIsPetModalOpen] = useState(false);

  const [profile, setProfile] = useState(initialProfile);
  const [profileForm, setProfileForm] = useState(initialProfile);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Pet form state — used for both Add and Edit
  const [petForm, setPetForm] = useState({
    id: null,
    type: "",
    name: "",
    breed: "",
  });

  function getInitials(name) {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }

  function getPetEmoji(typeName) {
    const match = petTypes.find((petType) => petType.name === typeName);
    return match ? match.emoji : "🐾";
  }

  // ----- Profile edit -----

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

  // ----- Password -----

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

  // ----- Pet management -----

  function openAddPetModal() {
    setPetForm({ id: null, type: "", name: "", breed: "" });
    setIsPetModalOpen(true);
  }

  function openEditPetModal(pet) {
    setPetForm({
      id: pet.id,
      type: pet.type,
      name: pet.name,
      breed: pet.breed || "",
    });
    setIsPetModalOpen(true);
  }

  function closePetModal() {
    setIsPetModalOpen(false);
  }

  function handlePetSubmit(event) {
    event.preventDefault();

    if (!petForm.type) {
      alert("Please select a pet type.");
      return;
    }

    if (!petForm.name.trim()) {
      alert("Please enter your pet's name.");
      return;
    }

    const emoji = getPetEmoji(petForm.type);

    if (petForm.id) {
      // Edit existing pet
      setProfile((prev) => ({
        ...prev,
        pets: prev.pets.map((pet) =>
          pet.id === petForm.id
            ? {
                ...pet,
                type: petForm.type,
                name: petForm.name.trim(),
                breed: petForm.breed.trim(),
                emoji,
              }
            : pet
        ),
      }));
    } else {
      // Add new pet
      const newPet = {
        id: Date.now(),
        type: petForm.type,
        name: petForm.name.trim(),
        breed: petForm.breed.trim(),
        emoji,
      };

      setProfile((prev) => ({
        ...prev,
        pets: [...prev.pets, newPet],
      }));
    }

    closePetModal();
  }

  function removePet(pet) {
    const confirmRemove = window.confirm(
      `Remove ${pet.name} (${pet.type}) from your pets?`
    );

    if (!confirmRemove) return;

    setProfile((prev) => ({
      ...prev,
      pets: prev.pets.filter((item) => item.id !== pet.id),
    }));
  }

  // ----- Renderers -----

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

  function renderPetModal() {
    if (!isPetModalOpen) return null;

    return (
      <div className="modal-backdrop" onClick={closePetModal}>
        <section
          className="admin-modal profile-modal"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="modal-header">
            <div>
              <p className="page-subtitle">My Pets</p>
              <h2>{petForm.id ? "Edit Pet" : "Add New Pet"}</h2>
            </div>

            <button className="modal-close-btn" onClick={closePetModal}>
              ×
            </button>
          </div>

          <form onSubmit={handlePetSubmit} className="admin-form">
            <label>
              Pet Type
              <select
                value={petForm.type}
                onChange={(event) =>
                  setPetForm({ ...petForm, type: event.target.value })
                }
              >
                <option value="">Select pet type</option>
                {petTypes.map((petType) => (
                  <option key={petType.id} value={petType.name}>
                    {petType.emoji} {petType.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Pet Name
              <input
                type="text"
                placeholder="e.g. Milo, Luna"
                value={petForm.name}
                onChange={(event) =>
                  setPetForm({ ...petForm, name: event.target.value })
                }
              />
            </label>

            <label>
              Breed <span style={{ color: "#6f7c73", fontWeight: 400 }}>(optional)</span>
              <input
                type="text"
                placeholder="e.g. Golden Retriever, Persian"
                value={petForm.breed}
                onChange={(event) =>
                  setPetForm({ ...petForm, breed: event.target.value })
                }
              />
            </label>

            <div className="form-actions">
              <button type="submit" className="primary-btn">
                {petForm.id ? "Save Changes" : "+ Add Pet"}
              </button>

              <button
                type="button"
                className="secondary-btn"
                onClick={closePetModal}
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
      {renderPetModal()}

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

        <section className="profile-pets-card">
          <div className="table-header-row">
            <div>
              <h2>My Pets</h2>
              <p className="form-note">
                Add the pets you care for so guides and quizzes can be tailored
                to them.
              </p>
            </div>

            <button className="primary-btn" onClick={openAddPetModal}>
              + Add Pet
            </button>
          </div>

          {profile.pets.length > 0 ? (
            <div className="my-pets-grid">
              {profile.pets.map((pet) => (
                <article key={pet.id} className="my-pet-card">
                  <div className="my-pet-emoji">{pet.emoji}</div>

                  <div className="my-pet-info">
                    <h3>{pet.name}</h3>
                    <p className="my-pet-type">{pet.type}</p>
                    {pet.breed && (
                      <p className="my-pet-breed">Breed: {pet.breed}</p>
                    )}
                  </div>

                  <div className="my-pet-actions">
                    <button
                      type="button"
                      className="secondary-btn"
                      onClick={() => openEditPetModal(pet)}
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      className="secondary-btn danger-outline"
                      onClick={() => removePet(pet)}
                    >
                      Remove
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="petowner-empty-state">
              <span className="empty-icon">🐾</span>
              <p>You have not added any pets yet. Click "+ Add Pet" to start.</p>
            </div>
          )}
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
