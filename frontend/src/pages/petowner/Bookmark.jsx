import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../../api";
import "../../styles/admin.css";
import "../../styles/petOwner.css";
import "../../styles/bookmark.css"; 

/* ─────────────────────────────────────────────────────────────
   Toast system
   ───────────────────────────────────────────────────────────── */

let toastId = 0;

function useToast() {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = "success") => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message, type, exiting: false }]);

    // Start exit animation after 2.8 s
    setTimeout(() => {
      setToasts((prev) =>
        prev.map((t) => (t.id === id ? { ...t, exiting: true } : t))
      );
    }, 2800);

    // Remove from DOM after animation
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3100);
  }, []);

  return { toasts, addToast };
}

function ToastPortal({ toasts }) {
  if (toasts.length === 0) return null;

  return (
    <div className="bm-toast-portal" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`bm-toast bm-toast-${t.type}${t.exiting ? " bm-toast-exit" : ""}`}
        >
          <span className="bm-toast-icon">
            {t.type === "success" ? "✅" : "⚠️"}
          </span>
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Confirm-remove modal
   ───────────────────────────────────────────────────────────── */

function ConfirmRemoveModal({ bookmark, onCancel, onConfirm, isRemoving }) {
  // Close on backdrop click
  function handleBackdropClick(e) {
    if (e.target === e.currentTarget) onCancel();
  }

  // Close on Escape
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onCancel();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return (
    <div className="bm-overlay" onClick={handleBackdropClick} role="dialog" aria-modal="true" aria-labelledby="bm-confirm-title">
      <div className="bm-confirm-modal">
        <div className="bm-confirm-icon" aria-hidden="true">🗑️</div>

        <h2 id="bm-confirm-title">Remove Bookmark?</h2>
        <p>
          Are you sure you want to remove{" "}
          <strong>"{bookmark.title}"</strong> from your bookmarks? You can
          always save it again later.
        </p>

        <div className="bm-confirm-actions">
          <button className="bm-btn-cancel" onClick={onCancel} disabled={isRemoving}>
            Cancel
          </button>

          <button
            className="bm-btn-danger"
            onClick={onConfirm}
            disabled={isRemoving}
            aria-label="Confirm remove bookmark"
          >
            {isRemoving ? (
              <>
                <span className="bm-spinner" aria-hidden="true" />
                Removing…
              </>
            ) : (
              <>🗑️ Remove</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Guide-preview modal
   ───────────────────────────────────────────────────────────── */

const SEVERITY_EMOJI = {
  low: "🟢",
  mild: "🟢",
  general: "🟢",
  medium: "🟡",
  moderate: "🟡",
  urgent: "🟡",
  high: "🔴",
  critical: "🔴",
  emergency: "🔴",
};

function GuidePreviewModal({ bookmark, onClose, onOpenFull, onRemove }) {
  function handleBackdropClick(e) {
    if (e.target === e.currentTarget) onClose();
  }

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const severityKey = bookmark.severity.toLowerCase();
  const severityEmoji = SEVERITY_EMOJI[severityKey] || "🔵";

  return (
    <div className="bm-overlay" onClick={handleBackdropClick} role="dialog" aria-modal="true" aria-labelledby="bm-guide-title">
      <div className="bm-guide-modal">
        {/* Hero header */}
        <div className="bm-guide-modal-hero">
          <button
            className="bm-guide-modal-close"
            onClick={onClose}
            aria-label="Close guide preview"
          >
            ✕
          </button>

          <div className="bm-guide-modal-pet-row">
            <span className="bm-guide-modal-pet-pill">
              {bookmark.petEmoji} {bookmark.pet}
            </span>
          </div>

          <h2 id="bm-guide-title">{bookmark.title}</h2>

          <div className="bm-guide-modal-meta">
            <span className={`severity-badge ${severityKey}`}>
              {severityEmoji} {bookmark.severity}
            </span>
            <span className="bm-guide-modal-saved">
              🔖 Saved {bookmark.savedAt}
            </span>
          </div>
        </div>

        {/* Body */}
        <div className="bm-guide-modal-body">
          <p className="bm-guide-modal-summary-label">About this guide</p>
          <p className="bm-guide-modal-summary">
            {bookmark.summary || "No description available for this topic."}
          </p>

          <div className="bm-guide-modal-actions">
            <button
              className="bm-btn-primary-full"
              onClick={() => onOpenFull(bookmark)}
            >
              📖 Open Full Guide
            </button>

            <button
              className="bm-btn-danger-outline"
              onClick={() => onRemove(bookmark)}
            >
              🗑️ Remove
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Main Bookmark page
   ───────────────────────────────────────────────────────────── */

function Bookmark() {
  const navigate = useNavigate();
  const { toasts, addToast } = useToast();

  const [bookmarks, setBookmarks] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [petFilter, setPetFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modal state
  const [confirmBookmark, setConfirmBookmark] = useState(null); // bookmark pending removal
  const [previewBookmark, setPreviewBookmark] = useState(null); // bookmark being previewed
  const [isRemoving, setIsRemoving] = useState(false);

  /* ── Load ────────────────────────────────────────────────── */
  useEffect(() => {
    let isCancelled = false;

    async function loadBookmarks() {
      try {
        setLoading(true);
        setError("");

        const data = await apiRequest("/api/petowner/bookmarks");

        if (isCancelled) return;

        const formatted = (data.bookmarks || []).map((bookmark) => ({
          id: bookmark.emergencyID,
          bookmarkID: bookmark.bookmarkID,
          title: bookmark.topicTitle,
          pet: bookmark.petName,
          petEmoji: bookmark.icon || "🐾",
          severity: bookmark.severity || "Moderate",
          summary: bookmark.topicDesc || "",
          savedAt: bookmark.saved_at
            ? new Date(bookmark.saved_at).toLocaleDateString()
            : "recently",
        }));

        setBookmarks(formatted);
      } catch (err) {
        if (isCancelled) return;
        setError(err.message || "Failed to load bookmarks.");
        setBookmarks([]);
      } finally {
        if (!isCancelled) setLoading(false);
      }
    }

    loadBookmarks();
    return () => { isCancelled = true; };
  }, []);

  /* ── Derived data ─────────────────────────────────────────── */
  const petOptions = useMemo(() => {
    const pets = new Set(bookmarks.map((b) => b.pet));
    return ["All", ...Array.from(pets)];
  }, [bookmarks]);

  const filteredBookmarks = useMemo(() => {
    const kw = searchKeyword.toLowerCase();
    return bookmarks.filter((b) => {
      const matchesSearch =
        b.title.toLowerCase().includes(kw) ||
        b.summary.toLowerCase().includes(kw) ||
        b.pet.toLowerCase().includes(kw);
      const matchesPet = petFilter === "All" || b.pet === petFilter;
      return matchesSearch && matchesPet;
    });
  }, [bookmarks, searchKeyword, petFilter]);

  /* ── Actions ──────────────────────────────────────────────── */

  // Step 1: user clicks "Remove" on a card → show confirm modal
  function requestRemove(bookmark) {
    // If guide preview is open, close it first then ask confirm
    setPreviewBookmark(null);
    setConfirmBookmark(bookmark);
  }

  // Step 2: user confirms removal in modal
  async function confirmRemove() {
    if (!confirmBookmark || isRemoving) return;

    setIsRemoving(true);
    try {
      await apiRequest(`/api/petowner/bookmarks/${confirmBookmark.id}`, {
        method: "DELETE",
      });

      setBookmarks((prev) => prev.filter((b) => b.id !== confirmBookmark.id));
      addToast(`"${confirmBookmark.title}" removed from bookmarks.`, "success");
    } catch (err) {
      addToast(err.message || "Failed to remove bookmark.", "error");
    } finally {
      setIsRemoving(false);
      setConfirmBookmark(null);
    }
  }

  function cancelRemove() {
    if (!isRemoving) setConfirmBookmark(null);
  }

  // Open guide preview modal (card click)
  function openPreview(bookmark) {
    setPreviewBookmark(bookmark);
  }

  // Navigate to full guide page (from preview modal)
  function openFullGuide(bookmark) {
    setPreviewBookmark(null);
    navigate(`/guide-details/${bookmark.id}`);
  }

  function retryLoad() {
    window.location.reload();
  }

  /* ── Render ───────────────────────────────────────────────── */
  return (
    <>
      {/* Toast layer */}
      <ToastPortal toasts={toasts} />

      {/* Confirm-remove modal */}
      {confirmBookmark && (
        <ConfirmRemoveModal
          bookmark={confirmBookmark}
          onCancel={cancelRemove}
          onConfirm={confirmRemove}
          isRemoving={isRemoving}
        />
      )}

      {/* Guide preview modal */}
      {previewBookmark && (
        <GuidePreviewModal
          bookmark={previewBookmark}
          onClose={() => setPreviewBookmark(null)}
          onOpenFull={openFullGuide}
          onRemove={requestRemove}
        />
      )}

      <div className="admin-page bm-page">
        <div className="page-title-row">
          <div className="page-title-area">
            <p className="page-subtitle">Saved For Later</p>
            <h1>My Bookmarks</h1>
          </div>
        </div>

        <section className="admin-table-card">
          <div className="table-header-row">
            <div>
              <h2>Bookmarked Topics</h2>
              <p className="form-note">
                Your saved emergency topics. Tap a card to preview the guide,
                or remove it when you no longer need it.
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="filter-row">
            <input
              type="text"
              placeholder="Search by topic, pet, or keyword…"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
            />

            <select
              value={petFilter}
              onChange={(e) => setPetFilter(e.target.value)}
            >
              {petOptions.map((option) => (
                <option key={option} value={option}>
                  {option === "All" ? "All Pets" : option}
                </option>
              ))}
            </select>
          </div>

          {/* Loading */}
          {loading && (
            <div className="petowner-empty-state">
              <span className="empty-icon">⏳</span>
              <p>Loading your bookmarks…</p>
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="petowner-empty-state">
              <span className="empty-icon">⚠️</span>
              <p>{error}</p>
              <button className="primary-btn" onClick={retryLoad}>
                Try Again
              </button>
            </div>
          )}

          {/* Grid */}
          {!loading && !error && filteredBookmarks.length > 0 && (
            <div className="bookmark-grid">
              {filteredBookmarks.map((bookmark) => (
                <article
                  key={bookmark.id}
                  className="bookmark-card"
                  style={{ cursor: "pointer" }}
                  onClick={() => openPreview(bookmark)}
                  role="button"
                  tabIndex={0}
                  aria-label={`Preview ${bookmark.title}`}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") openPreview(bookmark);
                  }}
                >
                  <div className="bookmark-card-header">
                    <h3>{bookmark.title}</h3>
                    <span className={`severity-badge ${bookmark.severity.toLowerCase()}`}>
                      {bookmark.severity}
                    </span>
                  </div>

                  <div className="bookmark-card-meta">
                    <span>{bookmark.petEmoji} {bookmark.pet}</span>
                  </div>

                  <p className="bookmark-card-summary">{bookmark.summary}</p>

                  <div
                    className="bookmark-card-footer"
                    onClick={(e) => e.stopPropagation()} // don't bubble to card
                  >
                    <small>Saved {bookmark.savedAt}</small>

                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        className="primary-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          openFullGuide(bookmark);
                        }}
                      >
                        Open Guide
                      </button>

                      <button
                        className="bookmark-remove-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          requestRemove(bookmark);
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && filteredBookmarks.length === 0 && (
            <div className="petowner-empty-state">
              <span className="empty-icon">🔖</span>
              <p>No bookmarks found. Try a different search or pet filter.</p>
            </div>
          )}
        </section>
      </div>
    </>
  );
}

export default Bookmark;