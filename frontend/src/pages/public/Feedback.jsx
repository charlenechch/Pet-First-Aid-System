import { useState } from "react";

const STAR_LABELS = ["", "Needs improvement", "Fair", "Good", "Very good", "Excellent"];
const MAX_CHARS = 500;

const GUIDE_CATEGORIES = [
  { value: "dog-emergency",  label: "🐶 Dog Emergency Guide",    color: "#EAF3DE", text: "#3B6D11" },
  { value: "cat-emergency",  label: "🐱 Cat Emergency Guide",    color: "#EAF3DE", text: "#3B6D11" },
  { value: "poisoning",      label: "💊 Pet Poisoning Guide",    color: "#FCEBEB", text: "#A32D2D" },
  { value: "heatstroke",     label: "🌡️ Heatstroke Guide",       color: "#FAEEDA", text: "#854F0B" },
  { value: "wounds",         label: "🩹 Wound & Bleeding Guide", color: "#FCEBEB", text: "#A32D2D" },
  { value: "choking",        label: "🫁 Choking Guide",          color: "#FCEBEB", text: "#A32D2D" },
  { value: "burns",          label: "🔥 Burns & Injury Guide",   color: "#FAEEDA", text: "#854F0B" },
  { value: "cpr",            label: "❤️ Pet CPR Guide",          color: "#FCEBEB", text: "#A32D2D" },
];

export default function PublicFeedback() {
  const [submitted, setSubmitted] = useState(false);
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [fields, setFields] = useState({ name: "", email: "", category: "", message: "" });
  const [errors, setErrors] = useState({});
  const [catOpen, setCatOpen] = useState(false);

  const emailValid = /\S+@\S+\.\S+/.test(fields.email);
  const isValid =
    fields.name.trim() && emailValid && rating > 0 &&
    fields.category && fields.message.trim().length >= 10;

  function update(key, val) {
    setFields((f) => ({ ...f, [key]: val }));
    setErrors((e) => ({ ...e, [key]: false }));
  }

  function handleSubmit() {
    const newErrors = {
      name: !fields.name.trim(),
      email: !emailValid,
      rating: rating === 0,
      category: !fields.category,
      message: fields.message.trim().length < 10,
    };
    setErrors(newErrors);
    if (Object.values(newErrors).some(Boolean)) return;
    setSubmitted(true);
  }

  function selectCategory(val) {
    update("category", val);
    setCatOpen(false);
  }

  const selectedCat = GUIDE_CATEGORIES.find((c) => c.value === fields.category);
  const displayRating = hovered || rating;

  if (submitted) {
    return (
      <main className="fb-page">
        <div className="fb-wrap">
          <div className="fb-success-card">
            <div className="fb-success-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
                stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <h2 className="fb-success-title">Thank you! 🎉</h2>
            <p className="fb-success-msg">
              We read every response and use it to make PawGuard better for every pet owner.
            </p>
            <button
              className="fb-reset-btn"
              onClick={() => {
                setSubmitted(false);
                setRating(0);
                setFields({ name: "", email: "", category: "", message: "" });
              }}
            >
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

        {/* HERO */}
        <div className="fb-hero">
          <p className="fb-hero-label">Feedback</p>
          <h1 className="fb-hero-title">Help us improve PawGuard</h1>
          <p className="fb-hero-sub">
            Share your experience — your feedback helps pet owners everywhere.
          </p>
        </div>

        {/* PROGRESS INDICATOR */}
        <div className="fb-progress-row">
          {["Your Info", "Rating", "Guide", "Message"].map((step, i) => {
            const filled = [
              fields.name && fields.email,
              rating > 0,
              fields.category,
              fields.message.length >= 10,
            ];
            return (
              <div key={step} className={`fb-progress-item ${filled[i] ? "done" : ""}`}>
                <div className="fb-progress-dot">
                  {filled[i] ? (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
                      stroke="white" strokeWidth="3" strokeLinecap="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    <span>{i + 1}</span>
                  )}
                </div>
                <span className="fb-progress-label">{step}</span>
              </div>
            );
          })}
        </div>

        <div className="fb-card">

          {/* SECTION: YOUR INFO */}
          <div className="fb-section">
            <div className="fb-section-header">
              <div className="fb-section-num">1</div>
              <h3 className="fb-section-title">Your information</h3>
            </div>
            <div className="fb-row">
              <div className="fb-field">
                <label className="fb-label">Full name <span className="fb-required">*</span></label>
                <input
                  className={`fb-input${errors.name ? " fb-input-err" : ""}`}
                  type="text"
                  placeholder="e.g. Sarah Lim"
                  value={fields.name}
                  onChange={(e) => update("name", e.target.value)}
                />
                {errors.name && <span className="fb-err">⚠ Name is required</span>}
              </div>
              <div className="fb-field">
                <label className="fb-label">Email address <span className="fb-required">*</span></label>
                <input
                  className={`fb-input${errors.email ? " fb-input-err" : ""}`}
                  type="email"
                  placeholder="you@example.com"
                  value={fields.email}
                  onChange={(e) => update("email", e.target.value)}
                />
                {errors.email && <span className="fb-err">⚠ Valid email required</span>}
              </div>
            </div>
          </div>

          <div className="fb-sep" />

          {/* SECTION: RATING */}
          <div className="fb-section">
            <div className="fb-section-header">
              <div className="fb-section-num">2</div>
              <h3 className="fb-section-title">Overall rating</h3>
            </div>
            <div className="fb-stars-wrap">
              <div className="fb-stars">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    className={`fb-star${n <= displayRating ? " fb-star-on" : ""}`}
                    onClick={() => { setRating(n); setErrors((e) => ({ ...e, rating: false })); }}
                    onMouseEnter={() => setHovered(n)}
                    onMouseLeave={() => setHovered(0)}
                    aria-label={`${n} star${n > 1 ? "s" : ""}`}
                  >
                    ★
                  </button>
                ))}
              </div>
              {displayRating > 0 && (
                <span className="fb-star-label">{STAR_LABELS[displayRating]}</span>
              )}
            </div>
            {errors.rating && <span className="fb-err">⚠ Please select a rating</span>}
          </div>

          <div className="fb-sep" />

          {/* SECTION: GUIDE */}
          <div className="fb-section">
            <div className="fb-section-header">
              <div className="fb-section-num">3</div>
              <h3 className="fb-section-title">Which guide are you rating?</h3>
            </div>
            <div className="fb-field" style={{ position: "relative" }}>
              <button
                type="button"
                className={`fb-cat-trigger${errors.category ? " fb-input-err" : ""}${catOpen ? " fb-cat-open" : ""}`}
                onClick={() => setCatOpen((v) => !v)}
              >
                {selectedCat ? (
                  <span className="fb-cat-pill"
                    style={{ background: selectedCat.color, color: selectedCat.text }}>
                    {selectedCat.label}
                  </span>
                ) : (
                  <span className="fb-cat-placeholder">Choose a guide category</span>
                )}
                <svg
                  className={`fb-cat-chevron${catOpen ? " fb-chevron-up" : ""}`}
                  width="14" height="14" viewBox="0 0 24 24"
                  fill="none" stroke="currentColor" strokeWidth="2"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {catOpen && (
                <div className="fb-cat-dropdown">
                  {GUIDE_CATEGORIES.map((cat) => (
                    <button
                      key={cat.value}
                      type="button"
                      className={`fb-cat-option${fields.category === cat.value ? " fb-cat-selected" : ""}`}
                      onClick={() => selectCategory(cat.value)}
                    >
                      <span className="fb-cat-pill"
                        style={{ background: cat.color, color: cat.text }}>
                        {cat.label}
                      </span>
                      {fields.category === cat.value && (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                          stroke="#639922" strokeWidth="2.5" strokeLinecap="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              )}
              {errors.category && <span className="fb-err">⚠ Please choose a guide</span>}
            </div>
          </div>

          <div className="fb-sep" />

          {/* SECTION: MESSAGE */}
          <div className="fb-section">
            <div className="fb-section-header">
              <div className="fb-section-num">4</div>
              <h3 className="fb-section-title">Your feedback</h3>
            </div>
            <div className="fb-field">
              <textarea
                className={`fb-input fb-textarea${errors.message ? " fb-input-err" : ""}`}
                placeholder="Tell us what you liked or what we can do better..."
                value={fields.message}
                maxLength={MAX_CHARS}
                onChange={(e) => update("message", e.target.value)}
              />
              <div className="fb-char-row">
                {errors.message && <span className="fb-err">⚠ Please write at least 10 characters</span>}
                <span className={`fb-char-count${fields.message.length > 450 ? " fb-char-warn" : ""}`}>
                  {fields.message.length} / {MAX_CHARS}
                </span>
              </div>
            </div>
          </div>

          <div className="fb-sep" />

          {/* FOOTER */}
          <div className="fb-footer">
            <div className="fb-privacy-row">
              <span className="fb-privacy-icon">🔒</span>
              <div>
                <p className="fb-privacy-title">Your info is kept private</p>
                <p className="fb-privacy-sub">We never share your details with third parties.</p>
              </div>
            </div>
            <button className="fb-submit" onClick={handleSubmit} disabled={!isValid}>
              Send feedback →
            </button>
          </div>

        </div>
      </div>
    </main>
  );
}