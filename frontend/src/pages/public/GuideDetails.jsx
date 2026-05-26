import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { apiRequest, getToken } from "../../api";

const GUIDES_PER_PAGE = 5;

export default function GuideDetails() {
  const { id } = useParams();

  const [guide, setGuide] = useState(null);
  const [otherGuides, setOtherGuides] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);

  const [feedback, setFeedback] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const petCategoryMap = {
    dog: { label: "Dog", emoji: "🐶" },
    cat: { label: "Cat", emoji: "🐱" },
    bird: { label: "Bird", emoji: "🐦" },
    rabbit: { label: "Rabbit", emoji: "🐰" },
    hamster: { label: "Hamster", emoji: "🐹" },
    fish: { label: "Fish", emoji: "🐟" },
  };

  // Load current guide details from backend
  useEffect(() => {
    let isCancelled = false;

    async function loadGuideDetails() {
      try {
        console.log("Loading guide details ID:", id);

        const data = await apiRequest(`/api/emergency-topics/${id}`);

        if (isCancelled) return;

        const topic = data.topic;

        const formattedGuide = {
          id: String(topic.emergencyID),
          icon: topic.icon || "🐾",
          title: topic.topicTitle,
          pet: topic.petName || "Pet",
          severity: topic.severity || "Moderate",
          desc: topic.topicDesc || "",
          condition: topic.topicTitle || "",
          signs: topic.signs || [],
          steps: Array.isArray(topic.steps)
            ? topic.steps
            : topic.steps
            ? String(topic.steps)
                .split("\n")
                .filter((step) => step.trim() !== "")
            : [],
          advice:
            topic.advice_text ||
            "Please contact a veterinarian immediately for professional advice.",
        };

        console.log("Guide details loaded:", formattedGuide);

        setGuide(formattedGuide);
        setError("");
      } catch (error) {
        if (isCancelled) return;

        console.error("Load guide details error:", error);
        setGuide(null);
        setError(error.message || "Failed to load guide details.");
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    loadGuideDetails();

    return () => {
      isCancelled = true;
    };
  }, [id]);

  // Load other guides from backend
  useEffect(() => {
    let isCancelled = false;

    async function loadOtherGuides() {
      try {
        const data = await apiRequest("/api/emergency-topics");

        if (isCancelled) return;

        const formattedGuides = (data.topics || [])
          .filter((topic) => String(topic.emergencyID) !== String(id))
          .map((topic) => ({
            id: String(topic.emergencyID),
            icon: topic.icon || "🐾",
            title: topic.topicTitle,
            pet: topic.petName,
            severity: topic.severity,
          }));

        console.log("Other guides loaded:", formattedGuides);

        setOtherGuides(formattedGuides);
      } catch (error) {
        if (isCancelled) return;

        console.error("Load other guides error:", error);
      }
    }

    loadOtherGuides();

    return () => {
      isCancelled = true;
    };
  }, [id]);

  // Load bookmark status from backend
  useEffect(() => {
    let isCancelled = false;

    async function loadBookmarks() {
      const token = getToken();

      if (!token) {
        if (!isCancelled) {
          setBookmarks([]);
        }
        return;
      }

      try {
        const data = await apiRequest("/api/petowner/bookmarks");

        if (isCancelled) return;

        const bookmarkIds = (data.bookmarks || []).map((item) =>
          String(item.emergencyID)
        );

        console.log("Bookmarks loaded in guide details:", bookmarkIds);

        setBookmarks(bookmarkIds);
      } catch (error) {
        if (isCancelled) return;

        console.error("Load bookmarks error:", error);
      }
    }

    loadBookmarks();

    return () => {
      isCancelled = true;
    };
  }, []);

  const toggleBookmark = async () => {
    const token = getToken();

    if (!token) {
      alert("Please login as pet owner before bookmarking.");
      return;
    }

    if (!guide) return;

    const guideId = String(guide.id);

    try {
      if (bookmarks.includes(guideId)) {
        await apiRequest(`/api/petowner/bookmarks/${guideId}`, {
          method: "DELETE",
        });

        setBookmarks((prev) => prev.filter((item) => item !== guideId));
      } else {
        await apiRequest("/api/petowner/bookmarks", {
          method: "POST",
          body: JSON.stringify({
            emergencyID: guideId,
          }),
        });

        setBookmarks((prev) => [...prev, guideId]);
      }
    } catch (error) {
      console.error("Toggle bookmark error:", error);
      alert(error.message || "Failed to update bookmark.");
    }
  };

  const retryLoadGuide = () => {
    window.location.reload();
  };

  if (loading) {
    return (
      <main className="guide-page">
        <section className="guide-hero">
          <span>Loading Guide</span>
          <h1>Loading emergency guide...</h1>
          <p>Please wait while we load the guide details.</p>
        </section>
      </main>
    );
  }

  if (error || !guide) {
    return (
      <main className="guide-page">
        <section className="guide-hero">
          <span>Guide Not Found</span>
          <h1>No matching guide</h1>
          <p>{error || "Please go back and choose another emergency topic."}</p>
        </section>

        <div className="guide-layout">
          <button className="home-btn-fill" onClick={retryLoadGuide}>
            Try Again
          </button>

          <Link to="/emergency-search" className="home-btn-fill">
            Back to Guides
          </Link>
        </div>
      </main>
    );
  }

  const isBookmarked = bookmarks.includes(String(guide.id));

  const petCategories = Array.isArray(guide.pet)
    ? guide.pet
    : String(guide.pet)
        .split(/[,/]/)
        .map((p) => p.trim().toLowerCase())
        .filter((p) => p !== "");

  const totalPages = Math.max(
    1,
    Math.ceil(otherGuides.length / GUIDES_PER_PAGE)
  );

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
            const info = petCategoryMap[pet] ?? {
              label: pet,
              emoji: "🐾",
            };

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
                <p>
                  <strong>This is a life-threatening emergency.</strong>
                </p>
              </div>

              <p className="guide-alert-right">
                Call your vet immediately while following these steps.
              </p>
            </div>
          )}

          {/* SIGNS SECTION */}
          {guide.signs && guide.signs.length > 0 && (
            <div className="guide-signs-section">
              <h2>
                Signs your pet is{" "}
                {guide.condition ?? guide.title.toLowerCase()}
              </h2>

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

          {guide.steps && guide.steps.length > 0 ? (
            guide.steps.map((step, index) => (
              <div className="guide-step-item" key={index}>
                <div>{index + 1}</div>
                <p>{step}</p>
              </div>
            ))
          ) : (
            <p className="guide-empty-text">
              No step-by-step instructions available for this guide yet.
            </p>
          )}

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
              {pagedGuides.length > 0 ? (
                pagedGuides.map((g) => (
                  <Link
                    key={g.id}
                    to={`/guide-details/${g.id}`}
                    className="guide-pagination-item"
                    onClick={() => {
                      setCurrentPage(1);
                      setFeedback(null);
                    }}
                  >
                    <span className="guide-pagination-icon">{g.icon}</span>

                    <div className="guide-pagination-info">
                      <p className="guide-pagination-title">{g.title}</p>
                      <p className="guide-pagination-severity">{g.severity}</p>
                    </div>

                    <span className="guide-pagination-arrow">›</span>
                  </Link>
                ))
              ) : (
                <p className="guide-empty-text">No other guides available.</p>
              )}
            </div>

            {/* PAGE NUMBERS */}
            {totalPages > 1 && (
              <div className="guide-pagination-controls">
                <button
                  className="guide-page-btn"
                  onClick={() =>
                    setCurrentPage((p) => Math.max(1, p - 1))
                  }
                  disabled={currentPage === 1}
                >
                  ‹
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <button
                      key={page}
                      className={`guide-page-btn ${
                        currentPage === page ? "active" : ""
                      }`}
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </button>
                  )
                )}

                <button
                  className="guide-page-btn"
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
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