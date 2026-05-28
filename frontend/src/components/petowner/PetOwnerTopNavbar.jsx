import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../../styles/admin.css";
import "../../styles/petOwner.css";

function getInitials(name = "") {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch (error) {
    console.error("Invalid user data in localStorage:", error);
    return null;
  }
}

function PetOwnerTopNavbar({ onMenuClick }) {
  const navigate = useNavigate();

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showLogoutSuccess, setShowLogoutSuccess] = useState(false);
  const [currentUser, setCurrentUser] = useState(getStoredUser);

  useEffect(() => {
    function syncUser() {
      setCurrentUser(getStoredUser());
    }

    window.addEventListener("userUpdated", syncUser);
    window.addEventListener("storage", syncUser);

    return () => {
      window.removeEventListener("userUpdated", syncUser);
      window.removeEventListener("storage", syncUser);
    };
  }, []);

  function openLogoutModal() {
    setShowLogoutModal(true);
  }

  function closeLogoutModal() {
    setShowLogoutModal(false);
  }

  function handleLogoutConfirm() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.dispatchEvent(new Event("userUpdated"));

    setShowLogoutModal(false);
    setShowLogoutSuccess(true);

    setTimeout(() => {
      setShowLogoutSuccess(false);
      navigate("/", { replace: true });
    }, 1200);
  }

  function handleGoHome() {
    navigate("/");
  }

  return (
    <>
      <header className="top-navbar">
        <div className="top-navbar-left">
          <button className="drawer-toggle-btn" onClick={onMenuClick}>
            ☰
          </button>

          <Link to="/petowner/dashboard" className="brand-area brand-link">
            <div className="brand-logo">🐾</div>

            <h1 className="brand-name">
              Paw<span>Guard</span>
            </h1>
          </Link>
        </div>

        <div className="top-navbar-center">
          <p>Pet Owner</p>
        </div>

        <div className="top-navbar-right">
          <button
            type="button"
            className="po-home-btn"
            onClick={handleGoHome}
          >
            Home
          </button>

          <Link
            to="/petowner/profile"
            className="admin-avatar-link"
            title="My Profile"
          >
            <div className="top-admin-avatar">
              {currentUser?.avatarUrl ? (
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.name || "Pet owner avatar"}
                />
              ) : (
                getInitials(currentUser?.name || "User")
              )}
            </div>
          </Link>

          <button className="logout-btn" onClick={openLogoutModal}>
            Log out
          </button>
        </div>
      </header>

      {showLogoutModal && (
        <div className="po-logout-modal-overlay">
          <div className="po-logout-modal">
            <div className="po-logout-modal-icon">🚪</div>

            <h2>Log out?</h2>

            <p>
              You will be signed out from your PawGuard pet owner account. You
              can log in again anytime.
            </p>

            <div className="po-logout-modal-actions">
              <button
                type="button"
                className="po-logout-cancel-btn"
                onClick={closeLogoutModal}
              >
                Cancel
              </button>

              <button
                type="button"
                className="po-logout-confirm-btn"
                onClick={handleLogoutConfirm}
              >
                Yes, log out
              </button>
            </div>
          </div>
        </div>
      )}

      {showLogoutSuccess && (
        <div className="po-logout-success">
          <div className="po-logout-success-icon">✓</div>

          <div>
            <strong>Logged out successfully</strong>
            <p>You are returning to the home page.</p>
          </div>
        </div>
      )}
    </>
  );
}

export default PetOwnerTopNavbar;