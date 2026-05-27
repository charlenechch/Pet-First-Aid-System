import { useEffect, useRef, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const STAR_LABELS = [
  "",
  "Needs improvement",
  "Fair",
  "Good",
  "Very good",
  "Excellent",
];

const MAX_CHARS = 500;

function getSeverityStyle(severity = "") {
  const value = severity.toLowerCase();

  if (value === "critical" || value === "high") {
    return {
      color: "#FCEBEB",
      text: "#A32D2D",
    };
  }

  if (value === "moderate" || value === "medium") {
    return {
      color: "#FAEEDA",
      text: "#854F0B",
    };
  }

  return {
    color: "#EAF3DE",
    text: "#3B6D11",
  };
}

export default function PublicFeedback() {
  const successCardRef = useRef(null);

  const [submitted, setSubmitted] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);

  const [guideCategories, setGuideCategories] = useState([]);
  const [loadingGuides, setLoadingGuides] = useState(true);
  const [guideError, setGuideError] = useState("");

  const [fields, setFields] = useState({
    name: "",
    email: "",
    category: "",
    emergencyID: null,
    message: "",
  });

  const [errors, setErrors] = useState({});
  const [catOpen, setCatOpen] = useState(false);

  const emailValid = /\S+@\S+\.\S+/.test(fields.email);

  const isValid =
    fields.name.trim() &&
    emailValid &&
    rating > 0 &&
    fields.category &&
    fields.emergencyID &&
    fields.message.trim().length >= 10;

  const selectedCat = guideCategories.find(
    (category) => String(category.value) === String(fields.category)
  );

  const displayRating = hovered || rating;

  useEffect(() => {
    let isCancelled = false;

    async function loadGuides() {
      try {
        setLoadingGuides(true);
        setGuideError("");

        const response = await fetch(`${API_URL}/api/emergency-topics`);

        let data = {};
        try {
          data = await response.json();
        } catch {
          data = {};
        }

        if (!response.ok) {
          throw new Error(data.message || "Failed to load guide list.");
        }

        const rawTopics = data.topics || data.emergencies || data.guides || data || [];

        const formattedGuides = Array.isArray(rawTopics)
          ? rawTopics.map((guide) => {
              const style = getSeverityStyle(guide.severity);

              return {
                value: String(guide.emergencyID),
                emergencyID: guide.emergencyID,
                category: guide.topicTitle,
                label: `${guide.icon || "🐾"} ${guide.topicTitle}`,
                petName: guide.petName || "",
                severity: guide.severity || "",
                color: style.color,
                text: style.text,
              };
            })
          : [];

        if (!isCancelled) {
          setGuideCategories(formattedGuides);
        }
      } catch (error) {
        console.error("Load guides error:", error);

        if (!isCancelled) {
          setGuideError(error.message || "Failed to load guides.");
          setGuideCategories([]);
        }
      } finally {
        if (!isCancelled) {
          setLoadingGuides(false);
        }
      }
    }

    loadGuides();

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!submitted) return;

    const timer = window.setTimeout(() => {
      successCardRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 120);

    return () => window.clearTimeout(timer);
  }, [submitted]);

  function update(key, value) {
    setFields((prev) => ({
      ...prev,
      [key]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [key]: false,
    }));

    setSubmitError("");
  }

  function selectCategory(value) {
    const guide = guideCategories.find(
      (item) => String(item.value) === String(value)
    );

    setFields((prev) => ({
      ...prev,
      category: value,
      emergencyID: guide?.emergencyID || null,
    }));

    setErrors((prev) => ({
      ...prev,
      category: false,
    }));

    setSubmitError("");
    setCatOpen(false);
  }

  function resetForm() {
    setSubmitted(false);
    setSubmitMessage("");
    setSubmitError("");
    setRating(0);
    setHovered(0);
    setFields({
      name: "",
      email: "",
      category: "",
      emergencyID: null,
      message: "",
    });
    setErrors({});
    setCatOpen(false);
  }

  async function readJson(response) {
    try {
      return await response.json();
    } catch {
      return {};
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const newErrors = {
      name: !fields.name.trim(),
      email: !emailValid,
      rating: rating === 0,
      category: !fields.category || !fields.emergencyID,
      message: fields.message.trim().length < 10,
    };

    setErrors(newErrors);
    setSubmitError("");
    setSubmitMessage("");

    if (Object.values(newErrors).some(Boolean)) {
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch(`${API_URL}/api/public/feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: fields.name.trim(),
          email: fields.email.trim(),
          category: selectedCat?.category || selectedCat?.label || fields.category,
          emergencyID: fields.emergencyID,
          rating: Number(rating),
          message: fields.message.trim(),
        }),
      });

      const data = await readJson(response);

      if (!response.ok) {
        throw new Error(data.message || "Failed to submit feedback.");
      }

      setSubmitMessage(
        data.message || "Your feedback has been submitted successfully."
      );
      setSubmitted(true);
    } catch (error) {
      console.error("Submit public feedback error:", error);
      setSubmitError(error.message || "Cannot submit feedback. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <main className="fb-page">
        <div className="fb-wrap">
          <div className="fb-success-card" ref={successCardRef}>
            <div className="fb-success-icon">
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>

            <h2 className="fb-success-title">Thank you! 🎉</h2>

            <p className="fb-success-msg">
              {submitMessage ||
                "We read every response and use it to make PawGuard better for every pet owner."}
            </p>

            <button className="fb-reset-btn" onClick={resetForm}>
              Submit another response
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="fb-page">
      <div className="fb-wrap">
        <div className="fb-hero">
          <p className="fb-hero-label">Feedback</p>

          <h1 className="fb-hero-title">Help us improve PawGuard</h1>

          <p className="fb-hero-sub">
            Share your experience — your feedback helps pet owners everywhere.
          </p>
        </div>

        <div className="fb-progress-row">
          {["Your Info", "Rating", "Guide", "Message"].map((step, index) => {
            const filled = [
              fields.name.trim() && emailValid,
              rating > 0,
              fields.category && fields.emergencyID,
              fields.message.trim().length >= 10,
            ];

            return (
              <div
                key={step}
                className={`fb-progress-item ${filled[index] ? "done" : ""}`}
              >
                <div className="fb-progress-dot">
                  {filled[index] ? (
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="white"
                      strokeWidth="3"
                      strokeLinecap="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>

                <span className="fb-progress-label">{step}</span>
              </div>
            );
          })}
        </div>

        <form className="fb-card" onSubmit={handleSubmit}>
          {submitError && (
            <div className="auth-alert error" style={{ marginBottom: "18px" }}>
              <div className="auth-alert-icon">!</div>

              <div className="auth-alert-text">
                <strong>Feedback submit failed</strong>
                <span>{submitError}</span>
              </div>
            </div>
          )}

          <div className="fb-section">
            <div className="fb-section-header">
              <div className="fb-section-num">1</div>
              <h3 className="fb-section-title">Your information</h3>
            </div>

            <div className="fb-row">
              <div className="fb-field">
                <label className="fb-label">
                  Full name <span className="fb-required">*</span>
                </label>

                <input
                  className={`fb-input${errors.name ? " fb-input-err" : ""}`}
                  type="text"
                  placeholder="e.g. Sarah Lim"
                  value={fields.name}
                  onChange={(event) => update("name", event.target.value)}
                  disabled={submitting}
                />

                {errors.name && (
                  <span className="fb-err">⚠ Name is required</span>
                )}
              </div>

              <div className="fb-field">
                <label className="fb-label">
                  Email address <span className="fb-required">*</span>
                </label>

                <input
                  className={`fb-input${errors.email ? " fb-input-err" : ""}`}
                  type="email"
                  placeholder="you@example.com"
                  value={fields.email}
                  onChange={(event) => update("email", event.target.value)}
                  disabled={submitting}
                />

                {errors.email && (
                  <span className="fb-err">⚠ Valid email required</span>
                )}
              </div>
            </div>
          </div>

          <div className="fb-sep" />

          <div className="fb-section">
            <div className="fb-section-header">
              <div className="fb-section-num">2</div>
              <h3 className="fb-section-title">Overall rating</h3>
            </div>

            <div className="fb-stars-wrap">
              <div className="fb-stars">
                {[1, 2, 3, 4, 5].map((number) => (
                  <button
                    key={number}
                    type="button"
                    className={`fb-star${
                      number <= displayRating ? " fb-star-on" : ""
                    }`}
                    onClick={() => {
                      setRating(number);
                      setErrors((prev) => ({
                        ...prev,
                        rating: false,
                      }));
                      setSubmitError("");
                    }}
                    onMouseEnter={() => setHovered(number)}
                    onMouseLeave={() => setHovered(0)}
                    aria-label={`${number} star${number > 1 ? "s" : ""}`}
                    disabled={submitting}
                  >
                    ★
                  </button>
                ))}
              </div>

              {displayRating > 0 && (
                <span className="fb-star-label">
                  {STAR_LABELS[displayRating]}
                </span>
              )}
            </div>

            {errors.rating && (
              <span className="fb-err">⚠ Please select a rating</span>
            )}
          </div>

          <div className="fb-sep" />

          <div className="fb-section">
            <div className="fb-section-header">
              <div className="fb-section-num">3</div>
              <h3 className="fb-section-title">Which guide are you rating?</h3>
            </div>

            <div className="fb-field" style={{ position: "relative" }}>
              <button
                type="button"
                className={`fb-cat-trigger${
                  errors.category ? " fb-input-err" : ""
                }${catOpen ? " fb-cat-open" : ""}`}
                onClick={() => setCatOpen((value) => !value)}
                disabled={submitting || loadingGuides}
              >
                {selectedCat ? (
                  <span
                    className="fb-cat-pill"
                    style={{
                      background: selectedCat.color,
                      color: selectedCat.text,
                    }}
                  >
                    {selectedCat.label}
                  </span>
                ) : (
                  <span className="fb-cat-placeholder">
                    {loadingGuides
                      ? "Loading guides..."
                      : guideError
                      ? "Unable to load guides"
                      : "Choose a guide category"}
                  </span>
                )}

                <svg
                  className={`fb-cat-chevron${
                    catOpen ? " fb-chevron-up" : ""
                  }`}
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {catOpen && (
                <div className="fb-cat-dropdown">
                  {loadingGuides ? (
                    <div className="fb-cat-option">
                      <span className="fb-cat-placeholder">
                        Loading guides...
                      </span>
                    </div>
                  ) : guideCategories.length === 0 ? (
                    <div className="fb-cat-option">
                      <span className="fb-cat-placeholder">
                        No guides available
                      </span>
                    </div>
                  ) : (
                    guideCategories.map((cat) => (
                      <button
                        key={cat.value}
                        type="button"
                        className={`fb-cat-option${
                          fields.category === cat.value
                            ? " fb-cat-selected"
                            : ""
                        }`}
                        onClick={() => selectCategory(cat.value)}
                        disabled={submitting}
                      >
                        <span
                          className="fb-cat-pill"
                          style={{
                            background: cat.color,
                            color: cat.text,
                          }}
                        >
                          {cat.label}
                        </span>

                        {fields.category === cat.value && (
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#639922"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </button>
                    ))
                  )}
                </div>
              )}

              {errors.category && (
                <span className="fb-err">⚠ Please choose a guide</span>
              )}

              {guideError && (
                <span className="fb-err">
                  ⚠ {guideError}
                </span>
              )}
            </div>
          </div>

          <div className="fb-sep" />

          <div className="fb-section">
            <div className="fb-section-header">
              <div className="fb-section-num">4</div>
              <h3 className="fb-section-title">Your feedback</h3>
            </div>

            <div className="fb-field">
              <textarea
                className={`fb-input fb-textarea${
                  errors.message ? " fb-input-err" : ""
                }`}
                placeholder="Tell us what you liked or what we can do better..."
                value={fields.message}
                maxLength={MAX_CHARS}
                onChange={(event) => update("message", event.target.value)}
                disabled={submitting}
              />

              <div className="fb-char-row">
                {errors.message && (
                  <span className="fb-err">
                    ⚠ Please write at least 10 characters
                  </span>
                )}

                <span
                  className={`fb-char-count${
                    fields.message.length > 450 ? " fb-char-warn" : ""
                  }`}
                >
                  {fields.message.length} / {MAX_CHARS}
                </span>
              </div>
            </div>
          </div>

          <div className="fb-sep" />

          <div className="fb-footer">
            <div className="fb-privacy-row">
              <span className="fb-privacy-icon">🔒</span>

              <div>
                <p className="fb-privacy-title">Your info is kept private</p>
                <p className="fb-privacy-sub">
                  We never share your details with third parties.
                </p>
              </div>
            </div>

            <button
              type="submit"
              className="fb-submit"
              disabled={!isValid || submitting}
            >
              {submitting ? "Sending..." : "Send feedback →"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}