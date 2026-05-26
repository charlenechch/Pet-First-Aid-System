import { useEffect, useState } from "react";
import { apiRequest } from "../../api";
import "../../styles/admin.css";
import "../../styles/petOwner.css";

function PetOwnerFeedback() {
  const [profile, setProfile] = useState({
    name: "",
    email: "",
  });

  const [feedbackList, setFeedbackList] = useState([]);
  const [guideOptions, setGuideOptions] = useState([]);

  const [form, setForm] = useState({
    emergencyID: "",
    rating: 0,
    message: "",
  });

  const [hoverRating, setHoverRating] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

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

        const formattedTopics = (topicsData.topics || []).map((topic) => ({
          emergencyID: topic.emergencyID,
          title: topic.topicTitle,
          petName: topic.petName,
          icon: topic.icon || "🐾",
          severity: topic.severity,
        }));

        const formattedFeedback = (feedbackData.feedback || []).map((item) => ({
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
        }));

        setGuideOptions(formattedTopics);
        setFeedbackList(formattedFeedback);
      } catch (error) {
        if (isCancelled) return;

        console.error("Load feedback page error:", error);
        setError(error.message || "Failed to load feedback page.");
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    loadFeedbackPage();

    return () => {
      isCancelled = true;
    };
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.emergencyID) {
      alert("Please select a topic.");
      return;
    }

    if (form.rating === 0) {
      alert("Please give a rating from 1 to 5 stars.");
      return;
    }

    if (form.message.trim().length < 10) {
      alert("Please enter at least 10 characters for your feedback.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      const data = await apiRequest("/api/petowner/feedback", {
        method: "POST",
        body: JSON.stringify({
          emergencyID: form.emergencyID,
          rating: form.rating,
          message: form.message.trim(),
        }),
      });

      const selectedTopic = guideOptions.find(
        (topic) => String(topic.emergencyID) === String(form.emergencyID)
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

      setForm({
        emergencyID: "",
        rating: 0,
        message: "",
      });

      setHoverRating(0);

      alert("Thank you! Your feedback has been submitted.");
    } catch (error) {
      console.error("Submit feedback error:", error);
      alert(error.message || "Failed to submit feedback.");
    } finally {
      setSubmitting(false);
    }
  }

  function clearForm() {
    if (submitting) return;

    setForm({
      emergencyID: "",
      rating: 0,
      message: "",
    });

    setHoverRating(0);
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
              onClick={() =>
                !submitting && setForm({ ...form, rating: value })
              }
              onMouseEnter={() => !submitting && setHoverRating(value)}
              onMouseLeave={() => !submitting && setHoverRating(0)}
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
    return "★".repeat(Number(rating)) + "☆".repeat(5 - Number(rating));
  }

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
            <p>Loading feedback page...</p>
          </div>
        </section>
      </div>
    );
  }

  return (
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
        <section className="admin-form-card">
          <h2>Submit Feedback</h2>

          <p className="form-note">
            Tell us what worked, what didn't, or what you'd like to see added.
            Your feedback helps improve the guides for every pet owner.
          </p>

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

          <form onSubmit={handleSubmit} className="admin-form">
            <label>
              Topic / Guide
              <select
                value={form.emergencyID}
                onChange={(event) =>
                  setForm({ ...form, emergencyID: event.target.value })
                }
                disabled={submitting}
              >
                <option value="">Select a topic</option>

                {guideOptions.map((option) => (
                  <option
                    key={option.emergencyID}
                    value={option.emergencyID}
                  >
                    {option.icon} {option.title} - {option.petName}
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
                disabled={submitting}
              />
            </label>

            <div className="form-actions">
              <button
                type="submit"
                className="primary-btn"
                disabled={submitting}
              >
                {submitting ? "Submitting..." : "Submit Feedback"}
              </button>

              <button
                type="button"
                className="secondary-btn"
                onClick={clearForm}
                disabled={submitting}
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

export default PetOwnerFeedback;