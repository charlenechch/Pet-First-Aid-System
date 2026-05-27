import { Link, useParams } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { apiRequest, getToken } from "../../api";

const GUIDES_PER_PAGE = 5;

function getEmbedUrl(url) {
  if (!url) return "";

  if (url.includes("youtube.com/watch?v=")) {
    const videoId = url.split("v=")[1]?.split("&")[0];
    return `https://www.youtube.com/embed/${videoId}`;
  }

  if (url.includes("youtu.be/")) {
    const videoId = url.split("youtu.be/")[1]?.split("?")[0];
    return `https://www.youtube.com/embed/${videoId}`;
  }

  if (url.includes("youtube.com/embed/")) {
    return url;
  }

  return url;
}

function formatSteps(steps) {
  if (!steps) return [];

  if (Array.isArray(steps)) {
    return steps
      .map((step) => String(step).trim())
      .filter(Boolean);
  }

  const raw = String(steps).trim();

  // If backend/database stores steps as JSON array string
  try {
    const parsed = JSON.parse(raw);

    if (Array.isArray(parsed)) {
      return parsed
        .map((step) => String(step).trim())
        .filter(Boolean);
    }
  } catch {
    // Continue to normal text handling below
  }

  // If admin stores steps line by line
  return raw
    .split(/\r?\n/)
    .map((step) =>
      step
        .trim()
        .replace(/^\[|\]$/g, "")
        .replace(/^["']|["'],?$/g, "")
        .replace(/,$/, "")
        .trim()
    )
    .filter((step) => step && step !== "[" && step !== "]");
}

export default function GuideDetails() {
  const { id } = useParams();

  const [guide, setGuide] = useState(null);
  const [otherGuides, setOtherGuides] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);

  const [feedback, setFeedback] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [updatingBookmark, setUpdatingBookmark] = useState(false);

  const toastTimerRef = useRef(null);

  const [toast, setToast] = useState({
    show: false,
    type: "success",
    title: "",
    message: "",
  });

  const petCategoryMap = {
    dog: { label: "Dog", emoji: "🐶" },
    cat: { label: "Cat", emoji: "🐱" },
    bird: { label: "Bird", emoji: "🐦" },
    rabbit: { label: "Rabbit", emoji: "🐰" },
    hamster: { label: "Hamster", emoji: "🐹" },
    fish: { label: "Fish", emoji: "🐟" },
  };

  function showToast(type, title, message) {
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }

    setToast({
      show: true,
      type,
      title,
      message,
    });

    toastTimerRef.current = window.setTimeout(() => {
      setToast((prev) => ({
        ...prev,
        show: false,
      }));
    }, 2600);
  }

  function closeToast() {
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }

    setToast((prev) => ({
      ...prev,
      show: false,
    }));
  }

  useEffect(() => {
    let isCancelled = false;

    async function loadGuideDetails() {
      try {
        setLoading(true);
        setError("");

        const data = await apiRequest(`/api/emergency-topics/${id}`);

        if (isCancelled) return;

        const topic = data.topic;

        const formattedGuide = {
          id: String(topic.emergencyID),
          guideID: topic.guideID,
          icon: topic.icon || "🐾",
          title: topic.topicTitle,
          pet: topic.petName || "Pet",
          severity: topic.severity || "Moderate",
          desc: topic.topicDesc || "",
          condition: topic.topicTitle || "",
          signs: topic.signs || [],
          steps: formatSteps(topic.steps),
          advice:
            topic.advice_text ||
            "Please contact a veterinarian immediately for professional advice.",
          media: Array.isArray(topic.media) ? topic.media : [],
        };

        setGuide(formattedGuide);
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

  useEffect(() => {
    let isCancelled = false;

    async function loadBookmarks() {
      const token = getToken();

      if (!token) return;

      try {
        const data = await apiRequest("/api/petowner/bookmarks");

        if (isCancelled) return;

        const bookmarkIds = (data.bookmarks || []).map((item) =>
          String(item.emergencyID)
        );

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

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  async function toggleBookmark() {
    const token = getToken();

    if (!token) {
      showToast(
        "warning",
        "Login required",
        "Please login as pet owner before bookmarking this guide."
      );
      return;
    }

    if (!guide || updatingBookmark) return;

    const guideId = String(guide.id);
    const isBookmarked = bookmarks.includes(guideId);

    try {
      setUpdatingBookmark(true);

      if (isBookmarked) {
        await apiRequest(`/api/petowner/bookmarks/${guideId}`, {
          method: "DELETE",
        });

        setBookmarks((prev) => prev.filter((item) => item !== guideId));

        showToast(
          "info",
          "Bookmark removed",
          `${guide.title} has been removed from your saved guides.`
        );
      } else {
        await apiRequest("/api/petowner/bookmarks", {
          method: "POST",
          body: JSON.stringify({
            emergencyID: guideId,
          }),
        });

        setBookmarks((prev) => [...prev, guideId]);

        showToast(
          "success",
          "Bookmark saved",
          `${guide.title} has been added to your saved guides.`
        );
      }
    } catch (error) {
      console.error("Toggle bookmark error:", error);

      showToast(
        "error",
        "Bookmark failed",
        error.message || "Failed to update bookmark. Please try again."
      );
    } finally {
      setUpdatingBookmark(false);
    }
  }

  function retryLoadGuide() {
    window.location.reload();
  }

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
        .map((pet) => pet.trim().toLowerCase())
        .filter(Boolean);

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
      {toast.show && (
        <div className={`bookmark-toast ${toast.type}`}>
          <div className="bookmark-toast-icon">
            {toast.type === "success"
              ? "✓"
              : toast.type === "error"
              ? "!"
              : toast.type === "warning"
              ? "⚠"
              : "★"}
          </div>

          <div className="bookmark-toast-content">
            <strong>{toast.title}</strong>
            <span>{toast.message}</span>
          </div>

          <button
            type="button"
            className="bookmark-toast-close"
            onClick={closeToast}
            aria-label="Close notification"
          >
            ×
          </button>
        </div>
      )}

      <nav className="guide-breadcrumb">
        <Link to="/">Home</Link>
        <span className="guide-breadcrumb-sep">›</span>
        <Link to="/emergency-search">Emergency Guides</Link>
        <span className="guide-breadcrumb-sep">›</span>
        <span className="guide-breadcrumb-current">{guide.title}</span>
      </nav>

      <section className="guide-hero">
        <span>{guide.severity} Emergency</span>

        <button
          type="button"
          className={`guide-bookmark-btn ${isBookmarked ? "bookmarked" : ""}`}
          onClick={toggleBookmark}
          disabled={updatingBookmark}
        >
          {updatingBookmark
            ? "Updating..."
            : isBookmarked
            ? "★ Bookmarked"
            : "☆ Bookmark"}
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

          {guide.desc && (
            <div className="guide-signs-section">
              <h2>Overview</h2>
              <p>{guide.desc}</p>
            </div>
          )}

          {guide.signs && guide.signs.length > 0 && (
            <div className="guide-signs-section">
              <h2>Signs your pet is {guide.condition}</h2>

              <div className="guide-signs-grid">
                {guide.signs.map((sign, index) => (
                  <div className="guide-sign-chip" key={index}>
                    🚨 {sign}
                  </div>
                ))}
              </div>
            </div>
          )}

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

          {guide.media && guide.media.length > 0 ? (
            <div className="guide-media-section">
              <h2>Video / Image Guide</h2>

              {guide.media.map((item) => {
                const mediaType = String(item.media_type || "").toLowerCase();
                const isVideo = mediaType === "video";
                const isImage = mediaType === "image";

                return (
                  <div key={item.mediaID} className="guide-media-card">
                    <h3>{item.mediaTitle || "Guide Media"}</h3>

                    {item.caption && <p>{item.caption}</p>}

                    {isVideo ? (
                      <div className="guide-video-frame">
                        <iframe
                          src={getEmbedUrl(item.mediaURL)}
                          title={item.mediaTitle || "Guide video"}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        ></iframe>
                      </div>
                    ) : isImage ? (
                      <img
                        src={item.mediaURL}
                        alt={item.mediaTitle || "Guide media"}
                        className="guide-media-image"
                      />
                    ) : (
                      <a
                        href={item.mediaURL}
                        target="_blank"
                        rel="noreferrer"
                        className="home-btn-fill"
                      >
                        Open media
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="guide-video-box">
              ▶️ No video or image guide added yet.
            </div>
          )}

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

        <aside className="guide-side-card">
          <h3>Vet Advice</h3>
          <p>{guide.advice}</p>

          <div className="guide-contact-box">
            📞 Emergency Vet Contact
            <strong>+60 12-345 6789</strong>
          </div>

          <div className="guide-pagination-section">
            <div className="guide-pagination-header">
              <h3>Other Guides</h3>

              <span className="guide-pagination-count">
                {otherGuides.length} guides
              </span>
            </div>

            <div className="guide-pagination-list">
              {pagedGuides.length > 0 ? (
                pagedGuides.map((otherGuide) => (
                  <Link
                    key={otherGuide.id}
                    to={`/guide-details/${otherGuide.id}`}
                    className="guide-pagination-item"
                    onClick={() => {
                      setCurrentPage(1);
                      setFeedback(null);
                    }}
                  >
                    <span className="guide-pagination-icon">
                      {otherGuide.icon}
                    </span>

                    <div className="guide-pagination-info">
                      <p className="guide-pagination-title">
                        {otherGuide.title}
                      </p>
                      <p className="guide-pagination-severity">
                        {otherGuide.severity}
                      </p>
                    </div>

                    <span className="guide-pagination-arrow">›</span>
                  </Link>
                ))
              ) : (
                <p className="guide-empty-text">No other guides available.</p>
              )}
            </div>

            {totalPages > 1 && (
              <div className="guide-pagination-controls">
                <button
                  className="guide-page-btn"
                  onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                  disabled={currentPage === 1}
                >
                  ‹
                </button>

                {Array.from({ length: totalPages }, (_, index) => index + 1).map(
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
                    setCurrentPage((page) => Math.min(totalPages, page + 1))
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