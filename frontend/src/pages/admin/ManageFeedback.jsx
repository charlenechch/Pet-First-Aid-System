import { useMemo, useState } from "react";
import "../../styles/admin.css";
import "../../styles/manageFeedback.css";

function ManageFeedback() {
  const [actionMenu, setActionMenu] = useState(null);
  const [selectedFeedback, setSelectedFeedback] = useState(null);

  const [searchKeyword, setSearchKeyword] = useState("");
  const [ratingFilter, setRatingFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  const [feedbackList, setFeedbackList] = useState([
    {
      id: 1,
      userName: "Jane Smith",
      userInitials: "JS",
      guideTitle: "Choking & Airway Blockage",
      petType: "Dog",
      petEmoji: "🐶",
      rating: 5,
      message:
        "Very clear step-by-step instructions. The images really helped me understand what to do. Would love more videos!",
      submittedAt: "2 hours ago",
      status: "New",
    },
    {
      id: 2,
      userName: "Mark Lim",
      userInitials: "ML",
      guideTitle: "Dog Heatstroke & Overheating",
      petType: "Dog",
      petEmoji: "🐶",
      rating: 3,
      message:
        "Step 4 needs more detail. I was not sure how much water to give. Maybe add quantities or measurements?",
      submittedAt: "Yesterday",
      status: "New",
    },
    {
      id: 3,
      userName: "Aisha Rahman",
      userInitials: "AR",
      guideTitle: "Rabbit Heatstroke Care",
      petType: "Rabbit",
      petEmoji: "🐰",
      rating: 4,
      message:
        "The guide is useful, but I think the warning signs should be shown earlier before the steps.",
      submittedAt: "2 days ago",
      status: "Reviewed",
    },
    {
      id: 4,
      userName: "Daniel Wong",
      userInitials: "DW",
      guideTitle: "Bird Wound & Bleeding Care",
      petType: "Bird",
      petEmoji: "🐦",
      rating: 2,
      message:
        "The advice is too general. I expected more specific instructions for small birds.",
      submittedAt: "4 days ago",
      status: "New",
    },
  ]);

  const feedbackStats = useMemo(() => {
    const total = feedbackList.length;

    const newCount = feedbackList.filter(
      (feedback) => feedback.status === "New"
    ).length;

    const reviewedCount = feedbackList.filter(
      (feedback) => feedback.status === "Reviewed"
    ).length;

    const averageRating =
      total === 0
        ? 0
        : (
            feedbackList.reduce((sum, feedback) => sum + feedback.rating, 0) /
            total
          ).toFixed(1);

    return {
      total,
      newCount,
      reviewedCount,
      averageRating,
    };
  }, [feedbackList]);

  const filteredFeedback = useMemo(() => {
    return feedbackList.filter((feedback) => {
      const keyword = searchKeyword.toLowerCase();

      const matchesSearch =
        feedback.userName.toLowerCase().includes(keyword) ||
        feedback.guideTitle.toLowerCase().includes(keyword) ||
        feedback.petType.toLowerCase().includes(keyword) ||
        feedback.message.toLowerCase().includes(keyword);

      const matchesRating =
        ratingFilter === "All" || feedback.rating === Number(ratingFilter);

      const matchesStatus =
        statusFilter === "All" || feedback.status === statusFilter;

      return matchesSearch && matchesRating && matchesStatus;
    });
  }, [feedbackList, searchKeyword, ratingFilter, statusFilter]);

  function openActionMenu(event, id) {
    const rect = event.currentTarget.getBoundingClientRect();
    const menuWidth = 180;
    const gap = 10;

    const hasSpaceRight = window.innerWidth - rect.right > menuWidth + gap;
    const left = hasSpaceRight
      ? rect.right + gap
      : Math.max(12, rect.left - menuWidth - gap);

    const top = Math.min(rect.top, window.innerHeight - 230);

    setActionMenu({
      id,
      left,
      top,
    });
  }

  function closeActionMenu() {
    setActionMenu(null);
  }

  function updateFeedbackStatus(id, status) {
    setFeedbackList((prevList) =>
      prevList.map((feedback) =>
        feedback.id === id ? { ...feedback, status } : feedback
      )
    );
  }

  function removeFeedback(id) {
    const confirmRemove = window.confirm(
      "Are you sure you want to remove this feedback? This action cannot be undone."
    );

    if (!confirmRemove) return;

    setFeedbackList((prevList) =>
      prevList.filter((feedback) => feedback.id !== id)
    );
  }

  function renderStars(rating) {
    return "★".repeat(rating) + "☆".repeat(5 - rating);
  }

  function getRatingLabel(rating) {
    if (rating >= 5) return "Excellent";
    if (rating >= 4) return "Good";
    if (rating >= 3) return "Average";
    return "Needs Attention";
  }

  function renderActionMenu() {
    if (!actionMenu) return null;

    const feedback = feedbackList.find((item) => item.id === actionMenu.id);

    if (!feedback) return null;

    return (
      <>
        <div className="floating-menu-backdrop" onClick={closeActionMenu} />

        <div
          className="floating-action-menu"
          style={{
            left: `${actionMenu.left}px`,
            top: `${actionMenu.top}px`,
          }}
        >
          <button
            onClick={() => {
              setSelectedFeedback(feedback);
              closeActionMenu();
            }}
          >
            View Details
          </button>

          {feedback.status === "New" && (
            <button
              onClick={() => {
                updateFeedbackStatus(feedback.id, "Reviewed");
                closeActionMenu();
              }}
            >
              Mark Reviewed
            </button>
          )}

          {feedback.status === "Reviewed" && (
            <button
              onClick={() => {
                updateFeedbackStatus(feedback.id, "New");
                closeActionMenu();
              }}
            >
              Mark as New
            </button>
          )}

          <button
            className="danger-text"
            onClick={() => {
              removeFeedback(feedback.id);
              closeActionMenu();
            }}
          >
            Remove
          </button>
        </div>
      </>
    );
  }

  function renderFeedbackDetailsModal() {
    if (!selectedFeedback) return null;

    return (
      <div className="modal-backdrop" onClick={() => setSelectedFeedback(null)}>
        <section
          className="admin-modal feedback-detail-modal"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="modal-header">
            <div>
              <p className="page-subtitle">Feedback Details</p>
              <h2>{selectedFeedback.userName}</h2>
            </div>

            <button
              className="modal-close-btn"
              onClick={() => setSelectedFeedback(null)}
            >
              ×
            </button>
          </div>

          <div className="feedback-detail-content">
            <div className="feedback-detail-row">
              <span>Guide</span>
              <strong>{selectedFeedback.guideTitle}</strong>
            </div>

            <div className="feedback-detail-row">
              <span>Pet Type</span>
              <strong>
                {selectedFeedback.petEmoji} {selectedFeedback.petType}
              </strong>
            </div>

            <div className="feedback-detail-row">
              <span>Rating</span>
              <strong>
                <span className="feedback-stars">
                  {renderStars(selectedFeedback.rating)}
                </span>{" "}
                {selectedFeedback.rating}/5
              </strong>
            </div>

            <div className="feedback-detail-row">
              <span>Status</span>
              <strong>{selectedFeedback.status}</strong>
            </div>

            <div className="feedback-message-box">
              <span>Message</span>
              <p>{selectedFeedback.message}</p>
            </div>
          </div>

          <div className="form-actions">
            {selectedFeedback.status === "New" && (
              <button
                className="primary-btn"
                onClick={() => {
                  updateFeedbackStatus(selectedFeedback.id, "Reviewed");
                  setSelectedFeedback({
                    ...selectedFeedback,
                    status: "Reviewed",
                  });
                }}
              >
                Mark Reviewed
              </button>
            )}

            {selectedFeedback.status === "Reviewed" && (
              <button
                className="secondary-btn"
                onClick={() => {
                  updateFeedbackStatus(selectedFeedback.id, "New");
                  setSelectedFeedback({
                    ...selectedFeedback,
                    status: "New",
                  });
                }}
              >
                Mark as New
              </button>
            )}

            <button
              className="secondary-btn danger-outline"
              onClick={() => {
                removeFeedback(selectedFeedback.id);
                setSelectedFeedback(null);
              }}
            >
              Remove Feedback
            </button>
          </div>
        </section>
      </div>
    );
  }

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
        <div className="feedback-stat-card">
          <span>Total Feedback</span>
          <strong>{feedbackStats.total}</strong>
        </div>

        <div className="feedback-stat-card">
          <span>New Feedback</span>
          <strong>{feedbackStats.newCount}</strong>
        </div>

        <div className="feedback-stat-card">
          <span>Reviewed</span>
          <strong>{feedbackStats.reviewedCount}</strong>
        </div>

        <div className="feedback-stat-card">
          <span>Average Rating</span>
          <strong>{feedbackStats.averageRating}</strong>
        </div>
      </div>

      <section className="admin-table-card">
        <div className="table-header-row">
          <div>
            <h2>Feedback List</h2>
            <p className="form-note">
              Review feedback submitted by users. Removed feedback will no longer
              appear in this list.
            </p>
          </div>
        </div>

        <div className="filter-row feedback-filter-row">
          <input
            type="text"
            placeholder="Search by user, guide, pet type, or message..."
            value={searchKeyword}
            onChange={(event) => setSearchKeyword(event.target.value)}
          />

          <select
            value={ratingFilter}
            onChange={(event) => setRatingFilter(event.target.value)}
          >
            <option value="All">All Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </select>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="All">All Status</option>
            <option value="New">New</option>
            <option value="Reviewed">Reviewed</option>
          </select>
        </div>

        <div className="feedback-list">
          {filteredFeedback.length > 0 ? (
            filteredFeedback.map((feedback) => (
              <article key={feedback.id} className="feedback-review-card">
                <div className="feedback-review-header">
                  <div className="feedback-user-area">
                    <div className="feedback-avatar">
                      {feedback.userInitials}
                    </div>

                    <div>
                      <h3>{feedback.userName}</h3>
                      <p>
                        {feedback.petEmoji} {feedback.petType} ·{" "}
                        {feedback.guideTitle} · {feedback.submittedAt}
                      </p>
                    </div>
                  </div>

                  <div className="feedback-rating-area">
                    <span className="feedback-stars">
                      {renderStars(feedback.rating)}
                    </span>
                    <small>{getRatingLabel(feedback.rating)}</small>
                  </div>
                </div>

                <p className="feedback-message">"{feedback.message}"</p>

                <div className="feedback-card-footer">
                  <span
                    className={
                      feedback.status === "Reviewed"
                        ? "status-badge"
                        : "status-badge draft"
                    }
                  >
                    {feedback.status}
                  </span>

                  <button
                    className="three-dot-btn"
                    onClick={(event) => openActionMenu(event, feedback.id)}
                  >
                    ⋯
                  </button>
                </div>
              </article>
            ))
          ) : (
            <p className="empty-table-text">No feedback found.</p>
          )}
        </div>
      </section>
    </div>
  );
}

export default ManageFeedback;