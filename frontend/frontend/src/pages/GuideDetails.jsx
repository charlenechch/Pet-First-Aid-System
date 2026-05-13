import { Link, useParams } from "react-router-dom";
import { useState } from "react";
import { guides } from "../data/guides";

const GUIDES_PER_PAGE = 5;

export default function GuideDetails() {
  const { id } = useParams();
  const guide = guides.find((item) => item.id === id);

  const [bookmarks, setBookmarks] = useState(() => {
    return JSON.parse(localStorage.getItem("pawguard-bookmarks") || "[]");
  });

  const [feedback, setFeedback] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  if (!guide) {
    return (
      <main className="guide-page">
        <section className="guide-hero">
          <span>Guide Not Found</span>
          <h1>No matching guide</h1>
          <p>Please go back and choose another emergency topic.</p>
        </section>
        <div className="guide-layout">
          <Link to="/emergency-search" className="home-btn-fill">
            Back to Guides
          </Link>
        </div>
      </main>
    );
  }

  const toggleBookmark = () => {
    let updated;
    if (bookmarks.includes(guide.id)) {
      updated = bookmarks.filter((item) => item !== guide.id);
    } else {
      updated = [...bookmarks, guide.id];
    }
    setBookmarks(updated);
    localStorage.setItem("pawguard-bookmarks", JSON.stringify(updated));
  };

  const isBookmarked = bookmarks.includes(guide.id);

  const petCategoryMap = {
    dog:     { label: "Dog",     emoji: "🐶" },
    cat:     { label: "Cat",     emoji: "🐱" },
    bird:    { label: "Bird",    emoji: "🐦" },
    rabbit:  { label: "Rabbit",  emoji: "🐰" },
    hamster: { label: "Hamster", emoji: "🐹" },
    fish:    { label: "Fish",    emoji: "🐟" },
  };

  const petCategories = Array.isArray(guide.pet)
    ? guide.pet
    : guide.pet.split(/[,/]/).map((p) => p.trim().toLowerCase());

  // All other guides except current, for pagination
  const otherGuides = guides.filter((g) => g.id !== guide.id);
  const totalPages  = Math.ceil(otherGuides.length / GUIDES_PER_PAGE);
  const pagedGuides = otherGuides.slice(
    (currentPage - 1) * GUIDES_PER_PAGE,
    currentPage * GUIDES_PER_PAGE
  );

  return (
    <main className="guide-page">

      {/* BREADCRUMB */}
      <nav className="guide-breadcrumb">
        <Link to="/">Home</Link>
        <span className="guide-breadcrumb-sep">›</span>
        <Link to="/emergency-search">Emergency Guides</Link>
        <span className="guide-breadcrumb-sep">›</span>
        <span className="guide-breadcrumb-current">{guide.title}</span>
      </nav>

      {/* HERO */}
      <section className="guide-hero">
        <span>{guide.severity} Emergency</span>

        <button className="guide-bookmark-btn" onClick={toggleBookmark}>
          {isBookmarked ? "★ Bookmarked" : "☆ Bookmark"}
        </button>

        <h1>
          {guide.icon} {guide.title}
        </h1>

        <div className="guide-pet-badges">
          <span className="guide-pet-label">For:</span>
          {petCategories.map((pet) => {
            const info = petCategoryMap[pet] ?? { label: pet, emoji: "🐾" };
            return (
              <span key={pet} className="guide-pet-badge">
                {info.emoji} {info.label}
              </span>
            );
          })}
        </div>

        <p>
          First-aid guide for {guide.pet}. Follow these steps while contacting a
          veterinarian.
        </p>
      </section>

      <section className="guide-layout">
        <div className="guide-steps-card">

          {/* EMERGENCY ALERT BANNER */}
          {guide.severity === "Critical" && (
            <div className="guide-alert-banner">
              <div className="guide-alert-left">
                <span className="guide-alert-icon">⚠️</span>
                <p><strong>This is a life-threatening emergency.</strong></p>
              </div>
              <p className="guide-alert-right">
                Call your vet immediately while following these steps.
              </p>
            </div>
          )}

          {/* SIGNS SECTION */}
          {guide.signs && guide.signs.length > 0 && (
            <div className="guide-signs-section">
              <h2>Signs your pet is {guide.condition ?? guide.title.toLowerCase()}</h2>
              <div className="guide-signs-grid">
                {guide.signs.map((sign, i) => (
                  <div className="guide-sign-chip" key={i}>
                    🚨 {sign}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEPS */}
          <h2>Step-by-step first-aid</h2>
          {guide.steps.map((step, index) => (
            <div className="guide-step-item" key={index}>
              <div>{index + 1}</div>
              <p>{step}</p>
            </div>
          ))}

          {/* VIDEO BOX */}
          <div className="guide-video-box">
            ▶️ Video / Image Guide Placeholder
          </div>

          {/* FEEDBACK */}
          <div className="guide-feedback-box">
            <p className="guide-feedback-title">Was this guide helpful?</p>
            {feedback === null ? (
              <div className="guide-feedback-btns">
                <button
                  className="guide-feedback-btn helpful"
                  onClick={() => setFeedback("helpful")}
                >
                  👍 Yes, very helpful
                </button>
                <button
                  className="guide-feedback-btn improve"
                  onClick={() => setFeedback("needs-improvement")}
                >
                  💡 Needs improvement
                </button>
              </div>
            ) : (
              <p className="guide-feedback-thanks">
                {feedback === "helpful"
                  ? "🎉 Thank you! We're glad it helped."
                  : "🙏 Thanks for the feedback. We'll work on improving it."}
              </p>
            )}
          </div>

        </div>

        {/* SIDEBAR */}
        <aside className="guide-side-card">

          {/* VET ADVICE */}
          <h3>Vet Advice</h3>
          <p>{guide.advice}</p>

          <div className="guide-contact-box">
            📞 Emergency Vet Contact
            <strong>+60 12-345 6789</strong>
          </div>

          {/* OTHER GUIDES WITH PAGINATION */}
          <div className="guide-pagination-section">
            <div className="guide-pagination-header">
              <h3>Other Guides</h3>
              <span className="guide-pagination-count">
                {otherGuides.length} guides
              </span>
            </div>

            <div className="guide-pagination-list">
              {pagedGuides.map((g) => (
                <Link
                  key={g.id}
                  to={`/guide-details/${g.id}`}
                  className="guide-pagination-item"
                >
                  <span className="guide-pagination-icon">{g.icon}</span>
                  <div className="guide-pagination-info">
                    <p className="guide-pagination-title">{g.title}</p>
                    <p className="guide-pagination-severity">{g.severity}</p>
                  </div>
                  <span className="guide-pagination-arrow">›</span>
                </Link>
              ))}
            </div>

            {/* PAGE NUMBERS */}
            {totalPages > 1 && (
              <div className="guide-pagination-controls">
                <button
                  className="guide-page-btn"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  ‹
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    className={`guide-page-btn ${currentPage === page ? "active" : ""}`}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </button>
                ))}

                <button
                  className="guide-page-btn"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  ›
                </button>
              </div>
            )}

            <p className="guide-pagination-meta">
              Page {currentPage} of {totalPages}
            </p>
          </div>

        </aside>
      </section>
    </main>
  );
}