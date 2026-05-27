import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { petTypes } from "../../data/petOwnerData";
import "../../styles/admin.css";
import "../../styles/adminProfile.css"; 
import "../../styles/petOwner.css";

const API_BASE_URL = import.meta.env.VITE_API_URL;

const emptyProfile = {
  userID: "",
  name: "",
  email: "",
  phone: "",
  role: "",
  status: "",
  bio: "",
  joined: "-",
  lastLogin: "-",
  initials: "U",
  avatarUrl: "",
  pets: [],
};

function Profile() {
  const navigate = useNavigate();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isPetModalOpen, setIsPetModalOpen] = useState(false);

  const [profile, setProfile] = useState(emptyProfile);

  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
    phone: "",
    bio: "",
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [petForm, setPetForm] = useState({
    id: null,
    type: "",
    name: "",
    breed: "",
  });

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [savingPet, setSavingPet] = useState(false);

  const [error, setError] = useState("");
  const [successToast, setSuccessToast] = useState("");

  function getToken() {
    return localStorage.getItem("token");
  }

  function getInitials(name) {
    if (!name) return "U";

    return name
      .split(" ")
      .filter(Boolean)
      .map((word) => word[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }

  function formatDate(dateValue) {
    if (!dateValue) return "-";

    let date;

    if (typeof dateValue === "string") {
      if (dateValue.includes(" ") && !dateValue.includes("T")) {
        date = new Date(dateValue.replace(" ", "T") + "Z");
      } else if (dateValue.includes("T") && !dateValue.endsWith("Z")) {
        date = new Date(dateValue + "Z");
      } else {
        date = new Date(dateValue);
      }
    } else {
      date = new Date(dateValue);
    }

    if (Number.isNaN(date.getTime())) {
      return "-";
    }

    return date.toLocaleString("en-MY", {
      timeZone: "Asia/Kuala_Lumpur",
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  }

  function getPetEmoji(typeName) {
    const match = petTypes.find((petType) => petType.name === typeName);
    return match ? match.emoji : "🐾";
  }

  function mapPetsFromBackend(pets = []) {
    return pets.map((pet) => ({
      id: pet.userPetID,
      petID: pet.petID,
      type: pet.petName,
      name: pet.userPetName,
      breed: pet.breed || "",
      emoji: pet.icon || getPetEmoji(pet.petName),
    }));
  }

  function mapUserToProfile(user, pets = []) {
    return {
      userID: user.userID || "",
      name: user.name || "",
      email: user.email || "",
      phone: user.phone_no || "",
      role: user.role === "pet_owner" ? "Pet Owner" : user.role || "User",
      status: user.status || "Active",
      bio: user.bio || "No bio added yet.",
      joined: formatDate(user.created_at),
      lastLogin: formatDate(user.last_login),
      initials: getInitials(user.name),
      avatarUrl: "",
      pets,
    };
  }

  async function readJson(response) {
    try {
      return await response.json();
    } catch {
      return {};
    }
  }

  function handleUnauthorized() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login", { replace: true });
  }

  function showSuccess(message) {
    setSuccessToast(message);

    window.setTimeout(() => {
      setSuccessToast("");
    }, 1800);
  }

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      try {
        const token = getToken();

        if (!token) {
          navigate("/login", { replace: true });
          return;
        }

        const response = await fetch(`${API_BASE_URL}/api/profile/me`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await readJson(response);

        if (!isMounted) return;

        if (response.status === 401) {
          handleUnauthorized();
          return;
        }

        if (!response.ok) {
          setError(data.message || "Failed to load profile.");
          return;
        }

        const mappedPets = mapPetsFromBackend(data.pets || []);

        setProfile(() => mapUserToProfile(data.user, mappedPets));
        localStorage.setItem("user", JSON.stringify(data.user));
      } catch (error) {
        console.error("Load profile error:", error);

        if (isMounted) {
          setError("Cannot connect to server. Please make sure backend is running.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  function openEditModal() {
    setProfileForm({
      name: profile.name,
      email: profile.email,
      phone: profile.phone,
      bio: profile.bio === "No bio added yet." ? "" : profile.bio,
    });

    setError("");
    setIsEditModalOpen(true);
  }

  function closeEditModal() {
    setIsEditModalOpen(false);
    setError("");
  }

  async function handleProfileSubmit(event) {
    event.preventDefault();
    setError("");

    if (!profileForm.name.trim()) {
      setError("Please enter your name.");
      return;
    }

    if (!profileForm.email.trim()) {
      setError("Please enter your email.");
      return;
    }

    if (!profileForm.phone.trim()) {
      setError("Please enter your phone number.");
      return;
    }

    try {
      setSavingProfile(true);

      const token = getToken();

      if (!token) {
        navigate("/login", { replace: true });
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/profile/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: profileForm.name.trim(),
          email: profileForm.email.trim(),
          phone_no: profileForm.phone.trim(),
          bio: profileForm.bio.trim(),
        }),
      });

      const data = await readJson(response);

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok) {
        setError(data.message || "Failed to update profile.");
        return;
      }

      setProfile((prev) => mapUserToProfile(data.user, prev.pets));
      localStorage.setItem("user", JSON.stringify(data.user));

      setIsEditModalOpen(false);
      showSuccess("Profile updated successfully.");
    } catch (error) {
      console.error("Update profile error:", error);
      setError("Cannot connect to server. Please make sure backend is running.");
    } finally {
      setSavingProfile(false);
    }
  }

  function openPasswordModal() {
    setPasswordForm({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });

    setError("");
    setIsPasswordModalOpen(true);
  }

  function closePasswordModal() {
    setIsPasswordModalOpen(false);
    setError("");
  }

  async function handlePasswordSubmit(event) {
    event.preventDefault();
    setError("");

    if (!passwordForm.currentPassword.trim()) {
      setError("Please enter current password.");
      return;
    }

    if (!passwordForm.newPassword.trim()) {
      setError("Please enter new password.");
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }

    try {
      setSavingPassword(true);

      const token = getToken();

      if (!token) {
        navigate("/login", { replace: true });
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/profile/change-password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(passwordForm),
      });

      const data = await readJson(response);

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok) {
        setError(data.message || "Failed to change password.");
        return;
      }

      setIsPasswordModalOpen(false);
      showSuccess("Password changed successfully.");
    } catch (error) {
      console.error("Change password error:", error);
      setError("Cannot connect to server. Please make sure backend is running.");
    } finally {
      setSavingPassword(false);
    }
  }

  function openAddPetModal() {
    setPetForm({
      id: null,
      type: "",
      name: "",
      breed: "",
    });

    setError("");
    setIsPetModalOpen(true);
  }

  function openEditPetModal(pet) {
    setPetForm({
      id: pet.id,
      type: pet.type,
      name: pet.name,
      breed: pet.breed || "",
    });

    setError("");
    setIsPetModalOpen(true);
  }

  function closePetModal() {
    if (savingPet) return;
    setIsPetModalOpen(false);
    setError("");
  }

  async function handlePetSubmit(event) {
    event.preventDefault();
    setError("");

    if (!petForm.type) {
      alert("Please select a pet type.");
      return;
    }

    if (!petForm.name.trim()) {
      alert("Please enter your pet's name.");
      return;
    }

    try {
      setSavingPet(true);

      const token = getToken();

      if (!token) {
        navigate("/login", { replace: true });
        return;
      }

      const isEdit = Boolean(petForm.id);

      const response = await fetch(
        isEdit
          ? `${API_BASE_URL}/api/profile/pets/${petForm.id}`
          : `${API_BASE_URL}/api/profile/pets`,
        {
          method: isEdit ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            type: petForm.type,
            name: petForm.name.trim(),
            breed: petForm.breed.trim(),
          }),
        }
      );

      const data = await readJson(response);

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok) {
        alert(data.message || "Failed to save pet.");
        return;
      }

      const savedPet = {
        id: data.pet.userPetID,
        petID: data.pet.petID,
        type: data.pet.petName,
        name: data.pet.userPetName,
        breed: data.pet.breed || "",
        emoji: data.pet.icon || getPetEmoji(data.pet.petName),
      };

      if (isEdit) {
        setProfile((prev) => ({
          ...prev,
          pets: prev.pets.map((pet) =>
            pet.id === petForm.id ? savedPet : pet
          ),
        }));

        showSuccess("Pet updated successfully.");
      } else {
        setProfile((prev) => ({
          ...prev,
          pets: [savedPet, ...prev.pets],
        }));

        showSuccess("Pet added successfully.");
      }

      setIsPetModalOpen(false);
    } catch (error) {
      console.error("Save pet error:", error);
      alert("Cannot connect to server. Please make sure backend is running.");
    } finally {
      setSavingPet(false);
    }
  }

  async function removePet(pet) {
    const confirmRemove = window.confirm(
      `Remove ${pet.name} (${pet.type}) from your pets?`
    );

    if (!confirmRemove) return;

    try {
      const token = getToken();

      if (!token) {
        navigate("/login", { replace: true });
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/profile/pets/${pet.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await readJson(response);

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok) {
        alert(data.message || "Failed to remove pet.");
        return;
      }

      setProfile((prev) => ({
        ...prev,
        pets: prev.pets.filter((item) => item.id !== pet.id),
      }));

      showSuccess("Pet removed successfully.");
    } catch (error) {
      console.error("Remove pet error:", error);
      alert("Cannot connect to server. Please make sure backend is running.");
    }
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

            <button
              type="button"
              className="modal-close-btn"
              onClick={closeEditModal}
            >
              ×
            </button>
          </div>

          {error && (
            <div className="auth-alert error" style={{ marginBottom: "16px" }}>
              <div className="auth-alert-icon">!</div>
              <div className="auth-alert-text">
                <strong>Update failed</strong>
                <span>{error}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleProfileSubmit} className="admin-form">
            <label>
              Full Name
              <input
                type="text"
                value={profileForm.name}
                onChange={(event) =>
                  setProfileForm((prev) => ({
                    ...prev,
                    name: event.target.value,
                  }))
                }
                disabled={savingProfile}
              />
            </label>

            <label>
              Email
              <input
                type="email"
                value={profileForm.email}
                onChange={(event) =>
                  setProfileForm((prev) => ({
                    ...prev,
                    email: event.target.value,
                  }))
                }
                disabled={savingProfile}
              />
            </label>

            <label>
              Phone Number
              <input
                type="text"
                value={profileForm.phone}
                onChange={(event) =>
                  setProfileForm((prev) => ({
                    ...prev,
                    phone: event.target.value,
                  }))
                }
                disabled={savingProfile}
              />
            </label>

            <label>
              Bio
              <textarea
                rows="4"
                value={profileForm.bio}
                onChange={(event) =>
                  setProfileForm((prev) => ({
                    ...prev,
                    bio: event.target.value,
                  }))
                }
                disabled={savingProfile}
              />
            </label>

            <div className="form-actions">
              <button type="submit" className="primary-btn" disabled={savingProfile}>
                {savingProfile ? "Saving..." : "Save Changes"}
              </button>

              <button
                type="button"
                className="secondary-btn"
                onClick={closeEditModal}
                disabled={savingProfile}
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

            <button
              type="button"
              className="modal-close-btn"
              onClick={closePasswordModal}
            >
              ×
            </button>
          </div>

          {error && (
            <div className="auth-alert error" style={{ marginBottom: "16px" }}>
              <div className="auth-alert-icon">!</div>
              <div className="auth-alert-text">
                <strong>Password update failed</strong>
                <span>{error}</span>
              </div>
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className="admin-form">
            <label>
              Current Password
              <input
                type="password"
                value={passwordForm.currentPassword}
                onChange={(event) =>
                  setPasswordForm((prev) => ({
                    ...prev,
                    currentPassword: event.target.value,
                  }))
                }
                disabled={savingPassword}
              />
            </label>

            <label>
              New Password
              <input
                type="password"
                value={passwordForm.newPassword}
                onChange={(event) =>
                  setPasswordForm((prev) => ({
                    ...prev,
                    newPassword: event.target.value,
                  }))
                }
                disabled={savingPassword}
              />
            </label>

            <label>
              Confirm New Password
              <input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(event) =>
                  setPasswordForm((prev) => ({
                    ...prev,
                    confirmPassword: event.target.value,
                  }))
                }
                disabled={savingPassword}
              />
            </label>

            <div className="form-actions">
              <button type="submit" className="primary-btn" disabled={savingPassword}>
                {savingPassword ? "Changing..." : "Change Password"}
              </button>

              <button
                type="button"
                className="secondary-btn"
                onClick={closePasswordModal}
                disabled={savingPassword}
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

            <button
              type="button"
              className="modal-close-btn"
              onClick={closePetModal}
              disabled={savingPet}
            >
              ×
            </button>
          </div>

          <form onSubmit={handlePetSubmit} className="admin-form">
            <label>
              Pet Type
              <select
                value={petForm.type}
                onChange={(event) =>
                  setPetForm((prev) => ({
                    ...prev,
                    type: event.target.value,
                  }))
                }
                disabled={savingPet}
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
                  setPetForm((prev) => ({
                    ...prev,
                    name: event.target.value,
                  }))
                }
                disabled={savingPet}
              />
            </label>

            <label>
              Breed{" "}
              <span style={{ color: "#6f7c73", fontWeight: 400 }}>
                (optional)
              </span>
              <input
                type="text"
                placeholder="e.g. Golden Retriever, Persian"
                value={petForm.breed}
                onChange={(event) =>
                  setPetForm((prev) => ({
                    ...prev,
                    breed: event.target.value,
                  }))
                }
                disabled={savingPet}
              />
            </label>

            <div className="form-actions">
              <button type="submit" className="primary-btn" disabled={savingPet}>
                {savingPet
                  ? "Saving..."
                  : petForm.id
                  ? "Save Changes"
                  : "+ Add Pet"}
              </button>

              <button
                type="button"
                className="secondary-btn"
                onClick={closePetModal}
                disabled={savingPet}
              >
                Cancel
              </button>
            </div>
          </form>
        </section>
      </div>
    );
  }

  if (loading) {
    return (
       <div className="admin-page shared-profile-page petowner-profile-page">
        <section className="admin-table-card">
          <h2>Loading Profile...</h2>
          <p className="form-note">
            Please wait while we load your account details.
          </p>
        </section>
      </div>
    );
  }

  return (
     <div className="admin-page shared-profile-page petowner-profile-page">
      {successToast && (
        <div className="profile-success-toast">
          <div className="profile-success-toast-icon">✓</div>

          <div>
            <strong>{successToast}</strong>
            <p>Your latest changes have been saved.</p>
          </div>
        </div>
      )}

      {renderEditModal()}
      {renderPasswordModal()}
      {renderPetModal()}

      <div className="page-title-row">
        <div className="page-title-area">
          <p className="page-subtitle">Pet Owner Account</p>
          <h1>My Profile</h1>
        </div>
      </div>

      {error && !isEditModalOpen && !isPasswordModalOpen && !isPetModalOpen && (
        <section className="admin-table-card" style={{ marginBottom: "20px" }}>
          <p className="form-note" style={{ color: "#b6533f", margin: 0 }}>
            {error}
          </p>
        </section>
      )}

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
            <button type="button" className="primary-btn" onClick={openEditModal}>
              Edit Profile
            </button>

            <button
              type="button"
              className="secondary-btn"
              onClick={openPasswordModal}
            >
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

            <button className="primary-btn add-pet-btn" onClick={openAddPetModal}>
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

            <button
              type="button"
              className="secondary-btn"
              onClick={openPasswordModal}
            >
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