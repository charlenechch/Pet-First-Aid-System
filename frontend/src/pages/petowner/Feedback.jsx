import { useEffect, useState, useCallback } from "react";
import { apiRequest } from "../../api";
import "../../styles/admin.css";
import "../../styles/petOwner.css";
import "../../styles/feedback.css"; 

/* ─────────────────────────────────────────────────────────────
   Toast system
   ───────────────────────────────────────────────────────────── */

let toastId = 0;

function useToast() {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = "success") => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message, type, exiting: false }]);

    setTimeout(() => {
      setToasts((prev) =>
        prev.map((t) => (t.id === id ? { ...t, exiting: true } : t))
      );
    }, 2800);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3100);
  }, []);

  return { toasts, addToast };
}

const TOAST_ICONS = { success: "✅", error: "⚠️", warning: "⚡" };

function ToastPortal({ toasts }) {
  if (toasts.length === 0) return null;
  return (
    <div className="fb-toast-portal" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`fb-toast fb-toast-${t.type}${t.exiting ? " fb-toast-exit" : ""}`}
        >
          <span className="fb-toast-icon">{TOAST_ICONS[t.type] ?? "ℹ️"}</span>
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Success submit modal
   ───────────────────────────────────────────────────────────── */

function SuccessModal({ submission, onClose, onSubmitAnother }) {
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function handleBackdrop(e) {
    if (e.target === e.currentTarget) onClose();
  }

  function renderStars(rating) {
    return "★".repeat(Number(rating)) + "☆".repeat(5 - Number(rating));
  }

  return (
    <div
      className="fb-overlay"
      onClick={handleBackdrop}
      role="dialog"
      aria-modal="true"
      aria-labelledby="fb-success-title"
    >
      <div className="fb-modal">
        {/* Hero */}
        <div className="fb-success-modal-hero">
          <div className="fb-success-icon-ring" aria-hidden="true">🎉</div>
          <h2 id="fb-success-title">Feedback Submitted!</h2>
          <p>
            Thank you for sharing your thoughts. Your feedback helps us improve
            guides for every pet owner.
          </p>
        </div>

        {/* Summary */}
        <div className="fb-success-modal-body">
          <div className="fb-success-summary">
            <div className="fb-success-summary-row">
              <span className="fb-success-summary-label">Topic</span>
              <span className="fb-success-summary-value">
                {submission.guideTitle}
              </span>
            </div>

            <div className="fb-success-summary-row">
              <span className="fb-success-summary-label">Rating</span>
              <span className="fb-success-stars">
                {renderStars(submission.rating)}
              </span>
            </div>

            <div className="fb-success-summary-row">
              <span className="fb-success-summary-label">Message</span>
              <span className="fb-success-summary-value">
                "{submission.message}"
              </span>
            </div>
          </div>

          <div className="fb-success-actions">
            <button className="fb-btn-secondary" onClick={onSubmitAnother}>
              Submit Another
            </button>
            <button className="fb-btn-primary" onClick={onClose}>
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Clear-form confirm modal
   ───────────────────────────────────────────────────────────── */

function ClearConfirmModal({ onCancel, onConfirm }) {
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onCancel();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  function handleBackdrop(e) {
    if (e.target === e.currentTarget) onCancel();
  }

  return (
    <div
      className="fb-overlay"
      onClick={handleBackdrop}
      role="dialog"
      aria-modal="true"
      aria-labelledby="fb-clear-title"
    >
      <div className="fb-modal">
        <div className="fb-confirm-modal-body">
          <div className="fb-confirm-icon-ring" aria-hidden="true">🗑️</div>
          <h2 id="fb-clear-title">Clear This Form?</h2>
          <p>
            All your current selections and typed text will be lost. This
            cannot be undone.
          </p>
          <div className="fb-confirm-actions">
            <button className="fb-btn-cancel" onClick={onCancel}>
              Keep Editing
            </button>
            <button className="fb-btn-warn" onClick={onConfirm}>
              Yes, Clear
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Helpers
   ───────────────────────────────────────────────────────────── */

const EMPTY_FORM = { emergencyID: "", rating: 0, message: "" };

function isFormDirty(form) {
  return form.emergencyID !== "" || form.rating !== 0 || form.message.trim() !== "";
}

/* ─────────────────────────────────────────────────────────────
   Main page
   ───────────────────────────────────────────────────────────── */

function PetOwnerFeedback() {
  const { toasts, addToast } = useToast();

  const [profile, setProfile] = useState({ name: "", email: "" });
  const [feedbackList, setFeedbackList] = useState([]);
  const [guideOptions, setGuideOptions] = useState([]);

  const [form, setForm] = useState(EMPTY_FORM);
  const [touched, setTouched] = useState({});   // tracks which fields were interacted with
  const [hoverRating, setHoverRating] = useState(0);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Modal visibility
  const [successSubmission, setSuccessSubmission] = useState(null); // holds submitted data
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  /* ── Load ─────────────────────────────────────────────────── */
  useEffect(() => {
    let isCancelled = false;

    async function loadFeedbackPage() {
      try {
        setLoading(true);
        setError("");

        const [profileData, topicsData, feedbackData] = await Promise.all([
          apiRequest("/api/profile/me"),
          apiRequest("/api/petowner/feedback/topics"),
          apiRequest("/api/petowner/feedback"),
        ]);

        if (isCancelled) return;

        setProfile({
          name: profileData.user?.name || "",
          email: profileData.user?.email || "",
        });

        setGuideOptions(
          (topicsData.topics || []).map((t) => ({
            emergencyID: t.emergencyID,
            title: t.topicTitle,
            petName: t.petName,
            icon: t.icon || "🐾",
            severity: t.severity,
          }))
        );

        setFeedbackList(
          (feedbackData.feedback || []).map((item) => ({
            id: item.feedbackID,
            emergencyID: item.emergencyID,
            guideTitle: item.topicTitle,
            rating: item.rating,
            message: item.message,
            submittedAt: item.submitted_at
              ? new Date(item.submitted_at).toLocaleString("en-MY", {
                  timeZone: "Asia/Kuala_Lumpur",
                  year: "numeric",
                  month: "short",
                  day: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                })
              : "-",
            status:
              item.status === "reviewed" || item.status === "Reviewed"
                ? "Reviewed"
                : "New",
          }))
        );
      } catch (err) {
        if (isCancelled) return;
        setError(err.message || "Failed to load feedback page.");
      } finally {
        if (!isCancelled) setLoading(false);
      }
    }

    loadFeedbackPage();
    return () => { isCancelled = true; };
  }, []);

  /* ── Inline validation ────────────────────────────────────── */
  function getErrors(f) {
    const errs = {};
    if (!f.emergencyID) errs.emergencyID = "Please select a topic.";
    if (f.rating === 0) errs.rating = "Please give a rating.";
    if (f.message.trim().length < 10)
      errs.message = "Message must be at least 10 characters.";
    return errs;
  }

  const errors = getErrors(form);

  /* ── Submit ───────────────────────────────────────────────── */
  async function handleSubmit(e) {
    e.preventDefault();

    // Mark all fields touched to show all errors at once
    setTouched({ emergencyID: true, rating: true, message: true });

    if (Object.keys(errors).length > 0) {
      addToast("Please fix the highlighted fields before submitting.", "warning");
      return;
    }

    try {
      setSubmitting(true);

      const data = await apiRequest("/api/petowner/feedback", {
        method: "POST",
        body: JSON.stringify({
          emergencyID: form.emergencyID,
          rating: form.rating,
          message: form.message.trim(),
        }),
      });

      const selectedTopic = guideOptions.find(
        (t) => String(t.emergencyID) === String(form.emergencyID)
      );

      const newFeedback = {
        id: data.feedbackID,
        emergencyID: form.emergencyID,
        guideTitle: selectedTopic?.title || "Selected Guide",
        rating: form.rating,
        message: form.message.trim(),
        submittedAt: "Just now",
        status: "New",
      };

      setFeedbackList((prev) => [newFeedback, ...prev]);

      // Show success modal with snapshot of what was submitted
      setSuccessSubmission({
        guideTitle: newFeedback.guideTitle,
        rating: form.rating,
        message: form.message.trim(),
      });

      // Reset form
      setForm(EMPTY_FORM);
      setTouched({});
      setHoverRating(0);
    } catch (err) {
      addToast(err.message || "Failed to submit feedback. Please try again.", "error");
    } finally {
      setSubmitting(false);
    }
  }

  /* ── Clear ────────────────────────────────────────────────── */
  function requestClear() {
    if (submitting) return;
    // Only ask for confirmation if the form has content
    if (isFormDirty(form)) {
      setShowClearConfirm(true);
    } else {
      addToast("Nothing to clear — form is already empty.", "warning");
    }
  }

  function confirmClear() {
    setForm(EMPTY_FORM);
    setTouched({});
    setHoverRating(0);
    setShowClearConfirm(false);
    addToast("Form cleared.", "success");
  }

  /* ── Star input ───────────────────────────────────────────── */
  function renderStarInput() {
    return (
      <div className={`star-rating-input ${hoverRating > 0 ? "hovering" : ""}`}>
        {[1, 2, 3, 4, 5].map((value) => {
          const filled = hoverRating > 0 ? value <= hoverRating : value <= form.rating;
          return (
            <span
              key={value}
              className={filled ? "active" : ""}
              onClick={() => {
                if (submitting) return;
                setForm((f) => ({ ...f, rating: value }));
                setTouched((t) => ({ ...t, rating: true }));
              }}
              onMouseEnter={() => !submitting && setHoverRating(value)}
              onMouseLeave={() => !submitting && setHoverRating(0)}
              role="button"
              aria-label={`${value} star`}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  setForm((f) => ({ ...f, rating: value }));
                  setTouched((t) => ({ ...t, rating: true }));
                }
              }}
            >
              ★
            </span>
          );
        })}
      </div>
    );
  }

  function renderStars(rating) {
    return "★".repeat(Number(rating)) + "☆".repeat(5 - Number(rating));
  }

  /* ── Success modal callbacks ──────────────────────────────── */
  function handleSuccessClose() {
    setSuccessSubmission(null);
  }

  function handleSubmitAnother() {
    setSuccessSubmission(null);
    // Scroll form into view smoothly
    document.getElementById("fb-form-section")?.scrollIntoView({ behavior: "smooth" });
  }

  /* ── Loading state ────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="admin-page">
        <div className="page-title-row">
          <div className="page-title-area">
            <p className="page-subtitle">Share Your Thoughts</p>
            <h1>Feedback</h1>
          </div>
        </div>
        <section className="admin-table-card">
          <div className="petowner-empty-state">
            <span className="empty-icon">⏳</span>
            <p>Loading feedback page…</p>
          </div>
        </section>
      </div>
    );
  }

  const charCount = form.message.length;
  const charOk = charCount >= 10;

  /* ── Render ───────────────────────────────────────────────── */
  return (
    <>
      {/* Toast layer */}
      <ToastPortal toasts={toasts} />

      {/* Success modal */}
      {successSubmission && (
        <SuccessModal
          submission={successSubmission}
          onClose={handleSuccessClose}
          onSubmitAnother={handleSubmitAnother}
        />
      )}

      {/* Clear confirm modal */}
      {showClearConfirm && (
        <ClearConfirmModal
          onCancel={() => setShowClearConfirm(false)}
          onConfirm={confirmClear}
        />
      )}

      <div className="admin-page">
        <div className="page-title-row">
          <div className="page-title-area">
            <p className="page-subtitle">Share Your Thoughts</p>
            <h1>Feedback</h1>
          </div>
        </div>

        {error && (
          <section className="admin-table-card" style={{ marginBottom: "20px" }}>
            <p className="form-note" style={{ color: "#b6533f", margin: 0 }}>
              {error}
            </p>
          </section>
        )}

        <div className="dashboard-grid">
          {/* ── Submit form ── */}
          <section className="admin-form-card" id="fb-form-section">
            <h2>Submit Feedback</h2>
            <p className="form-note">
              Tell us what worked, what didn't, or what you'd like to see
              added. Your feedback helps improve the guides for every pet owner.
            </p>

            {/* Submitting-as badge */}
            <div
              className="form-note"
              style={{
                padding: "12px 14px",
                border: "1px solid #e5e2dc",
                borderRadius: "12px",
                marginBottom: "16px",
                background: "#faf9f6",
              }}
            >
              <strong>Submitting as:</strong>{" "}
              {profile.name || "Pet Owner"}{" "}
              {profile.email ? `(${profile.email})` : ""}
            </div>

            <form onSubmit={handleSubmit} className="admin-form" noValidate>
              {/* Topic */}
              <label>
                Topic / Guide
                <select
                  value={form.emergencyID}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, emergencyID: e.target.value }));
                    setTouched((t) => ({ ...t, emergencyID: true }));
                  }}
                  disabled={submitting}
                  style={
                    touched.emergencyID && errors.emergencyID
                      ? { borderColor: "#c0583e" }
                      : {}
                  }
                >
                  <option value="">Select a topic</option>
                  {guideOptions.map((opt) => (
                    <option key={opt.emergencyID} value={opt.emergencyID}>
                      {opt.icon} {opt.title} — {opt.petName}
                    </option>
                  ))}
                </select>
                {touched.emergencyID && errors.emergencyID && (
                  <span className="fb-field-hint">{errors.emergencyID}</span>
                )}
              </label>

              {/* Rating */}
              <label>
                Rating
                {renderStarInput()}
                {touched.rating && errors.rating && (
                  <span className="fb-field-hint">{errors.rating}</span>
                )}
              </label>

              {/* Message */}
              <label>
                Message
                <textarea
                  rows="5"
                  placeholder="Share your thoughts about this topic or guide…"
                  value={form.message}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, message: e.target.value }));
                    setTouched((t) => ({ ...t, message: true }));
                  }}
                  disabled={submitting}
                  style={
                    touched.message && errors.message
                      ? { borderColor: "#c0583e" }
                      : {}
                  }
                />
                {touched.message && errors.message && (
                  <span className="fb-field-hint">{errors.message}</span>
                )}
                <span className={`fb-char-count${charOk ? " fb-char-ok" : ""}`}>
                  {charCount} / 10 min{charOk ? " ✓" : ""}
                </span>
              </label>

              <div className="form-actions">
                <button
                  type="submit"
                  className="primary-btn"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <span className="fb-spinner" aria-hidden="true" />
                      Submitting…
                    </>
                  ) : (
                    "Submit Feedback"
                  )}
                </button>

                <button
                  type="button"
                  className="secondary-btn"
                  onClick={requestClear}
                  disabled={submitting}
                >
                  Clear
                </button>
              </div>
            </form>
          </section>

          {/* ── Feedback history ── */}
          <section className="admin-table-card">
            <h2>My Feedback History</h2>
            <p className="form-note">
              A record of feedback you have submitted.
            </p>

            {feedbackList.length > 0 ? (
              <div className="feedback-history-list">
                {feedbackList.map((fb) => (
                  <article key={fb.id} className="feedback-history-card">
                    <div className="feedback-history-card-header">
                      <h3>{fb.guideTitle}</h3>
                      <span className="feedback-history-stars">
                        {renderStars(fb.rating)}
                      </span>
                    </div>

                    <p className="feedback-history-message">
                      "{fb.message}"
                    </p>

                    <div className="feedback-history-meta">
                      <span>{fb.submittedAt}</span>
                      <span
                        className={
                          fb.status === "Reviewed"
                            ? "status-badge"
                            : "status-badge draft"
                        }
                      >
                        {fb.status}
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="petowner-empty-state">
                <span className="empty-icon">💬</span>
                <p>You have not submitted any feedback yet.</p>
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  );
}

export default PetOwnerFeedback;