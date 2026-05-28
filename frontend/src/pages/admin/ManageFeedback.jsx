import { useEffect, useMemo, useState } from "react";
import "../../styles/admin.css";
import "../../styles/manageFeedback.css";

const API_URL = import.meta.env.VITE_API_URL;

function getInitials(name = "") {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function relativeTime(dateString) {
  if (!dateString) return "—";
  const diff = Math.floor((new Date() - new Date(dateString)) / 1000);
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
  if (diff < 172800) return "Yesterday";
  return `${Math.floor(diff / 86400)} days ago`;
}

function ManageFeedback() {
  const [actionMenu, setActionMenu] = useState(null);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [feedbackList, setFeedbackList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchKeyword, setSearchKeyword] = useState("");
  const [ratingFilter, setRatingFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  const token = localStorage.getItem("token");

  // ── Fetch ─────────────────────────────────────────────────
useEffect(() => {
  async function fetchFeedback() {
    try {
      const token = localStorage.getItem("token");

      const res = await fetch(`${API_URL}/api/admin/feedback`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to load feedback.");

      const data = await res.json();

      setFeedbackList(
        (data.feedback || []).map((f) => ({
          id: f.feedbackID,
          userName: f.userName,
          userInitials: getInitials(f.userName),
          topicTitle: f.topicTitle || "—",
          rating: f.rating,
          message: f.message,
          submittedAt: f.submitted_at,
          status: f.status === "new" ? "New" : "Reviewed",
        }))
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  fetchFeedback();
}, []);

  // ── Stats ─────────────────────────────────────────────────
  const feedbackStats = useMemo(() => {
    const total = feedbackList.length;
    const newCount = feedbackList.filter((f) => f.status === "New").length;
    const reviewedCount = feedbackList.filter((f) => f.status === "Reviewed").length;
    const averageRating = total === 0 ? 0 : (feedbackList.reduce((sum, f) => sum + f.rating, 0) / total).toFixed(1);
    return { total, newCount, reviewedCount, averageRating };
  }, [feedbackList]);

  // ── Filter ────────────────────────────────────────────────
  const filteredFeedback = useMemo(() => {
    return feedbackList.filter((feedback) => {
      const keyword = searchKeyword.toLowerCase();
      const matchesSearch =
        feedback.userName.toLowerCase().includes(keyword) ||
        feedback.topicTitle.toLowerCase().includes(keyword) ||
        feedback.message.toLowerCase().includes(keyword);
      const matchesRating = ratingFilter === "All" || feedback.rating === Number(ratingFilter);
      const matchesStatus = statusFilter === "All" || feedback.status === statusFilter;
      return matchesSearch && matchesRating && matchesStatus;
    });
  }, [feedbackList, searchKeyword, ratingFilter, statusFilter]);

  // ── Actions ───────────────────────────────────────────────
  async function updateFeedbackStatus(id, status) {
    const apiStatus = status === "Reviewed" ? "reviewed" : "new";
    try {
      const res = await fetch(`${API_URL}/api/admin/feedback/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: apiStatus }),
      });
      if (!res.ok) { const d = await res.json(); alert(d.message || "Failed to update."); return; }
      setFeedbackList((prev) => prev.map((f) => f.id === id ? { ...f, status } : f));
      if (selectedFeedback?.id === id) setSelectedFeedback((prev) => ({ ...prev, status }));
    } catch { alert("Server error."); }
  }

  async function removeFeedback(id) {
    if (!window.confirm("Are you sure you want to remove this feedback? This cannot be undone.")) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/feedback/${id}`, {
        method: "DELETE", headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) { const d = await res.json(); alert(d.message || "Failed to delete."); return; }
      setFeedbackList((prev) => prev.filter((f) => f.id !== id));
      if (selectedFeedback?.id === id) setSelectedFeedback(null);
    } catch { alert("Server error."); }
  }

  function renderStars(rating) { return "★".repeat(rating) + "☆".repeat(5 - rating); }
  function getRatingLabel(rating) {
    if (rating >= 5) return "Excellent";
    if (rating >= 4) return "Good";
    if (rating >= 3) return "Average";
    return "Needs Attention";
  }

  function openActionMenu(event, id) {
    const rect = event.currentTarget.getBoundingClientRect();
    const menuWidth = 180; const gap = 10;
    const hasSpaceRight = window.innerWidth - rect.right > menuWidth + gap;
    const left = hasSpaceRight ? rect.right + gap : Math.max(12, rect.left - menuWidth - gap);
    const top = Math.min(rect.top, window.innerHeight - 230);
    setActionMenu({ id, left, top });
  }
  function closeActionMenu() { setActionMenu(null); }

  function renderActionMenu() {
    if (!actionMenu) return null;
    const feedback = feedbackList.find((f) => f.id === actionMenu.id);
    if (!feedback) return null;
    return (
      <>
        <div className="floating-menu-backdrop" onClick={closeActionMenu} />
        <div className="floating-action-menu" style={{ left: `${actionMenu.left}px`, top: `${actionMenu.top}px` }}>
          <button onClick={() => { setSelectedFeedback(feedback); closeActionMenu(); }}>View Details</button>
          {feedback.status === "New" && (
            <button onClick={() => { updateFeedbackStatus(feedback.id, "Reviewed"); closeActionMenu(); }}>Mark Reviewed</button>
          )}
          {feedback.status === "Reviewed" && (
            <button onClick={() => { updateFeedbackStatus(feedback.id, "New"); closeActionMenu(); }}>Mark as New</button>
          )}
          <button className="danger-text" onClick={() => { removeFeedback(feedback.id); closeActionMenu(); }}>Remove</button>
        </div>
      </>
    );
  }

  function renderFeedbackDetailsModal() {
    if (!selectedFeedback) return null;
    return (
      <div className="modal-backdrop" onClick={() => setSelectedFeedback(null)}>
        <section className="admin-modal feedback-detail-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <div><p className="page-subtitle">Feedback Details</p><h2>{selectedFeedback.userName}</h2></div>
            <button className="modal-close-btn" onClick={() => setSelectedFeedback(null)}>×</button>
          </div>
          <div className="feedback-detail-content">
            <div className="feedback-detail-row"><span>Topic</span><strong>{selectedFeedback.topicTitle}</strong></div>
            <div className="feedback-detail-row">
              <span>Rating</span>
              <strong><span className="feedback-stars">{renderStars(selectedFeedback.rating)}</span> {selectedFeedback.rating}/5</strong>
            </div>
            <div className="feedback-detail-row"><span>Submitted</span><strong>{relativeTime(selectedFeedback.submittedAt)}</strong></div>
            <div className="feedback-detail-row"><span>Status</span><strong>{selectedFeedback.status}</strong></div>
            <div className="feedback-message-box"><span>Message</span><p>{selectedFeedback.message}</p></div>
          </div>
          <div className="form-actions">
            {selectedFeedback.status === "New" && (
              <button className="primary-btn" onClick={() => updateFeedbackStatus(selectedFeedback.id, "Reviewed")}>Mark Reviewed</button>
            )}
            {selectedFeedback.status === "Reviewed" && (
              <button className="secondary-btn" onClick={() => updateFeedbackStatus(selectedFeedback.id, "New")}>Mark as New</button>
            )}
            <button className="secondary-btn danger-outline" onClick={() => removeFeedback(selectedFeedback.id)}>Remove Feedback</button>
          </div>
        </section>
      </div>
    );
  }

  if (loading) return <div className="admin-page"><p>Loading…</p></div>;
  if (error) return <div className="admin-page"><p style={{ color: "crimson" }}>{error}</p></div>;

  return (
    <div className="admin-page">
      {renderActionMenu()}
      {renderFeedbackDetailsModal()}

      <div className="page-title-row">
        <div className="page-title-area">
          <p className="page-subtitle">Admin Management</p>
          <h1>Feedback Reviews</h1>
        </div>
      </div>

      <div className="feedback-stats-grid">
        <div className="feedback-stat-card"><span>Total Feedback</span><strong>{feedbackStats.total}</strong></div>
        <div className="feedback-stat-card"><span>New Feedback</span><strong>{feedbackStats.newCount}</strong></div>
        <div className="feedback-stat-card"><span>Reviewed</span><strong>{feedbackStats.reviewedCount}</strong></div>
        <div className="feedback-stat-card"><span>Average Rating</span><strong>{feedbackStats.averageRating} ★</strong></div>
      </div>

      <section className="admin-table-card">
        <div className="table-header-row">
          <div>
            <h2>Feedback List</h2>
            <p className="form-note">Review feedback submitted by users. Removed feedback cannot be recovered.</p>
          </div>
        </div>

        <div className="filter-row feedback-filter-row">
          <input type="text" placeholder="Search by user, topic, or message..." value={searchKeyword} onChange={(e) => setSearchKeyword(e.target.value)} />
          <select value={ratingFilter} onChange={(e) => setRatingFilter(e.target.value)}>
            <option value="All">All Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="All">All Status</option>
            <option value="New">New</option>
            <option value="Reviewed">Reviewed</option>
          </select>
        </div>

        <div className="feedback-list">
          {filteredFeedback.length > 0 ? filteredFeedback.map((feedback) => (
            <article key={feedback.id} className="feedback-review-card">
              <div className="feedback-review-header">
                <div className="feedback-user-area">
                  <div className="feedback-avatar">{feedback.userInitials}</div>
                  <div>
                    <h3>{feedback.userName}</h3>
                    <p>{feedback.topicTitle} · {relativeTime(feedback.submittedAt)}</p>
                  </div>
                </div>
                <div className="feedback-rating-area">
                  <span className="feedback-stars">{renderStars(feedback.rating)}</span>
                  <small>{getRatingLabel(feedback.rating)}</small>
                </div>
              </div>
              <p className="feedback-message">"{feedback.message}"</p>
              <div className="feedback-card-footer">
                <span className={feedback.status === "Reviewed" ? "status-badge" : "status-badge draft"}>{feedback.status}</span>
                <button className="three-dot-btn" onClick={(e) => openActionMenu(e, feedback.id)}>⋯</button>
              </div>
            </article>
          )) : (
            <p className="empty-table-text">No feedback found.</p>
          )}
        </div>
      </section>
    </div>
  );
}

export default ManageFeedback;