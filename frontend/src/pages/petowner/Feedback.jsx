import { useState } from "react";
import { myFeedback as initialFeedback } from "../../data/petOwnerData";
import "../../styles/admin.css";
import "../../styles/petOwner.css";

function Feedback() {
  const [feedbackList, setFeedbackList] = useState(initialFeedback);

  const [form, setForm] = useState({
    guideTitle: "",
    rating: 0,
    message: "",
  });

  const [hoverRating, setHoverRating] = useState(0);

  const guideOptions = [
    "Choking & Airway Blockage",
    "Dog Heatstroke & Overheating",
    "Cat Poisoning Response",
    "Rabbit Heatstroke Care",
    "Bird Wound & Bleeding Care",
    "Dog Seizure First Aid",
    "General Feedback",
  ];

  function handleSubmit(event) {
    event.preventDefault();

    if (!form.guideTitle) {
      alert("Please select a topic.");
      return;
    }

    if (form.rating === 0) {
      alert("Please give a rating from 1 to 5 stars.");
      return;
    }

    if (!form.message.trim()) {
      alert("Please enter your feedback message.");
      return;
    }

    const newFeedback = {
      id: Date.now(),
      guideTitle: form.guideTitle,
      rating: form.rating,
      message: form.message.trim(),
      submittedAt: "Just now",
      status: "New",
    };

    setFeedbackList((prev) => [newFeedback, ...prev]);

    setForm({
      guideTitle: "",
      rating: 0,
      message: "",
    });

    alert("Thank you! Your feedback has been submitted.");
  }

  function renderStarInput() {
    return (
      <div
        className={`star-rating-input ${hoverRating > 0 ? "hovering" : ""}`}
      >
        {[1, 2, 3, 4, 5].map((value) => {
          const shouldFill =
            hoverRating > 0 ? value <= hoverRating : value <= form.rating;

          return (
            <span
              key={value}
              className={shouldFill ? "active" : ""}
              onClick={() => setForm({ ...form, rating: value })}
              onMouseEnter={() => setHoverRating(value)}
              onMouseLeave={() => setHoverRating(0)}
              role="button"
              aria-label={`${value} star`}
            >
              ★
            </span>
          );
        })}
      </div>
    );
  }

  function renderStars(rating) {
    return "★".repeat(rating) + "☆".repeat(5 - rating);
  }

  return (
    <div className="admin-page">
      <div className="page-title-row">
        <div className="page-title-area">
          <p className="page-subtitle">Share Your Thoughts</p>
          <h1>Feedback</h1>
        </div>
      </div>

      <div className="dashboard-grid">
        <section className="admin-form-card">
          <h2>Submit Feedback</h2>

          <p className="form-note">
            Tell us what worked, what didn't, or what you'd like to see added.
            Your feedback helps improve the guides for every pet owner.
          </p>

          <form onSubmit={handleSubmit} className="admin-form">
            <label>
              Topic / Guide
              <select
                value={form.guideTitle}
                onChange={(event) =>
                  setForm({ ...form, guideTitle: event.target.value })
                }
              >
                <option value="">Select a topic</option>
                {guideOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Rating
              {renderStarInput()}
            </label>

            <label>
              Message
              <textarea
                rows="5"
                placeholder="Share your thoughts about this topic or guide..."
                value={form.message}
                onChange={(event) =>
                  setForm({ ...form, message: event.target.value })
                }
              />
            </label>

            <div className="form-actions">
              <button type="submit" className="primary-btn">
                Submit Feedback
              </button>

              <button
                type="button"
                className="secondary-btn"
                onClick={() =>
                  setForm({ guideTitle: "", rating: 0, message: "" })
                }
              >
                Clear
              </button>
            </div>
          </form>
        </section>

        <section className="admin-table-card">
          <h2>My Feedback History</h2>

          <p className="form-note">
            A record of feedback you have submitted.
          </p>

          {feedbackList.length > 0 ? (
            <div className="feedback-history-list">
              {feedbackList.map((feedback) => (
                <article
                  key={feedback.id}
                  className="feedback-history-card"
                >
                  <div className="feedback-history-card-header">
                    <h3>{feedback.guideTitle}</h3>
                    <span className="feedback-history-stars">
                      {renderStars(feedback.rating)}
                    </span>
                  </div>

                  <p className="feedback-history-message">
                    "{feedback.message}"
                  </p>

                  <div className="feedback-history-meta">
                    <span>{feedback.submittedAt}</span>
                    <span
                      className={
                        feedback.status === "Reviewed"
                          ? "status-badge"
                          : "status-badge draft"
                      }
                    >
                      {feedback.status}
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
  );
}

export default Feedback;
