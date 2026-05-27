import { Link, useSearchParams } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { apiRequest, getToken } from "../../api";

const PET_ICONS = {
  "All Pets": "🐾",
  Dog: "🐶",
  Cat: "🐱",
  Rabbit: "🐰",
  Bird: "🐦",
  Hamster: "🐹",
  Fish: "🐟",
};

const SEVERITIES = ["All Severity", "Critical", "Moderate", "Mild"];

const SEVERITY_STYLES = {
  "All Severity": { bg: "#f3f4f6", color: "#6b7280" },
  Critical: { bg: "#FCEBEB", color: "#A32D2D" },
  Moderate: { bg: "#FAEEDA", color: "#854F0B" },
  Mild: { bg: "#EAF3DE", color: "#3B6D11" },
};

const GUIDES_PER_PAGE = 9;

export default function EmergencySearch() {
  const [params] = useSearchParams();

  const [petOptions, setPetOptions] = useState(["All Pets"]);
  const [pet, setPet] = useState(params.get("pet") || "All Pets");
  const [severity, setSeverity] = useState("All Severity");
  const [search, setSearch] = useState(params.get("keyword") || "");
  const [currentPage, setCurrentPage] = useState(1);

  const resultsRef = useRef(null);
  const toastTimerRef = useRef(null);

  const [guides, setGuides] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [updatingBookmarkId, setUpdatingBookmarkId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [toast, setToast] = useState({
    show: false,
    type: "success",
    title: "",
    message: "",
  });

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

  // Load pet types from database
  useEffect(() => {
    let isCancelled = false;

    async function loadPetOptions() {
      try {
        const data = await apiRequest("/api/emergency-topics");

        if (isCancelled) return;

        const topics = data.topics || [];

        const petMap = new Map();

        topics.forEach((topic) => {
          const petName = topic.petName?.trim();

          if (!petName) return;

          const key = petName.toLowerCase();

          if (!petMap.has(key)) {
            petMap.set(key, petName);
          }
        });

        const databasePets = Array.from(petMap.values());

        const sortedPets = databasePets.sort((a, b) => a.localeCompare(b));

        setPetOptions(["All Pets", ...sortedPets]);

        if (pet !== "All Pets" && !databasePets.includes(pet)) {
          setPet("All Pets");
        }
      } catch (error) {
        console.error("Load pet options error:", error);
        setPetOptions(["All Pets"]);
      }
    }

    loadPetOptions();

    return () => {
      isCancelled = true;
    };
  }, []);

  // Load emergency topics
  useEffect(() => {
    let isCancelled = false;

    async function loadTopics() {
      try {
        const query = new URLSearchParams();

        if (search.trim() !== "") {
          query.append("keyword", search.trim());
        }

        if (pet !== "All Pets") {
          query.append("pet", pet);
        }

        if (severity !== "All Severity") {
          query.append("severity", severity);
        }

        const data = await apiRequest(
          `/api/emergency-topics?${query.toString()}`
        );

        if (isCancelled) return;

        const formattedGuides = (data.topics || []).map((topic) => ({
          id: topic.emergencyID,
          icon: topic.icon || PET_ICONS[topic.petName] || "🐾",
          title: topic.topicTitle,
          pet: topic.petName,
          severity: topic.severity,
          keywords: topic.keywords || "",
          desc: topic.topicDesc || "",
          color: "",
        }));

        setGuides(formattedGuides);
        setError("");
      } catch (error) {
        if (isCancelled) return;

        console.error("Load emergency topics error:", error);
        setGuides([]);
        setError(error.message || "Failed to load emergency topics.");
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    loadTopics();

    return () => {
      isCancelled = true;
    };
  }, [pet, severity, search]);

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

  const handlePetChange = (selectedPet) => {
    setLoading(true);
    setPet(selectedPet);
    setCurrentPage(1);
  };

  const handleSeverityChange = (selectedSeverity) => {
    setLoading(true);
    setSeverity(selectedSeverity);
    setCurrentPage(1);
  };

  const handleSearchChange = (value) => {
    setLoading(true);
    setSearch(value);
    setCurrentPage(1);
  };

  const clearSearch = () => {
    setLoading(true);
    setPet("All Pets");
    setSeverity("All Severity");
    setSearch("");
    setCurrentPage(1);
  };

  const retryLoadTopics = () => {
    window.location.reload();
  };

  const toggleBookmark = async (id, title = "this guide") => {
    const token = getToken();

    if (!token) {
      showToast(
        "warning",
        "Login required",
        "Please login as pet owner before bookmarking guides."
      );
      return;
    }

    const bookmarkId = String(id);
    const isBookmarked = bookmarks.includes(bookmarkId);

    try {
      setUpdatingBookmarkId(bookmarkId);

      if (isBookmarked) {
        await apiRequest(`/api/petowner/bookmarks/${id}`, {
          method: "DELETE",
        });

        setBookmarks((prev) => prev.filter((item) => item !== bookmarkId));

        showToast(
          "info",
          "Bookmark removed",
          `${title} has been removed from your saved guides.`
        );
      } else {
        await apiRequest("/api/petowner/bookmarks", {
          method: "POST",
          body: JSON.stringify({
            emergencyID: id,
          }),
        });

        setBookmarks((prev) => [...prev, bookmarkId]);

        showToast(
          "success",
          "Bookmark saved",
          `${title} has been added to your saved guides.`
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
      setUpdatingBookmarkId(null);
    }
  };

  const filteredGuides = guides.filter((guide) => {
    const matchPet = pet === "All Pets" || guide.pet === pet;

    const matchSeverity =
      severity === "All Severity" || guide.severity === severity;

    const keyword = search.toLowerCase();

    const matchSearch =
      guide.title.toLowerCase().includes(keyword) ||
      guide.keywords.toLowerCase().includes(keyword) ||
      guide.desc.toLowerCase().includes(keyword);

    return matchPet && matchSeverity && matchSearch;
  });

  const totalPages = Math.max(
    1,
    Math.ceil(filteredGuides.length / GUIDES_PER_PAGE)
  );

  const pagedGuides = filteredGuides.slice(
    (currentPage - 1) * GUIDES_PER_PAGE,
    currentPage * GUIDES_PER_PAGE
  );

  const hasFilters =
    pet !== "All Pets" || severity !== "All Severity" || search !== "";

  const goToPage = (page) => {
    setCurrentPage(page);
    resultsRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const getPageNumbers = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    const pages = [];

    if (currentPage <= 4) {
      pages.push(1, 2, 3, 4, 5, "...", totalPages);
    } else if (currentPage >= totalPages - 3) {
      pages.push(
        1,
        "...",
        totalPages - 4,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages
      );
    } else {
      pages.push(
        1,
        "...",
        currentPage - 1,
        currentPage,
        currentPage + 1,
        "...",
        totalPages
      );
    }

    return pages;
  };

  return (
    <main className="search-page">
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

      <section className="search-hero">
        <p className="search-label">Guides & Emergency Search</p>
        <h1>Find the right first-aid guide fast</h1>
        <p>Filter by pet type, severity level, or search by keyword.</p>
      </section>

      <section className="search-filter-card">
        <div className="search-filter-group">
          <p className="search-filter-label">Pet type</p>

          <div className="search-pet-pills">
            {petOptions.map((item) => (
              <button
                key={item}
                type="button"
                className={`search-pet-pill ${pet === item ? "active" : ""}`}
                onClick={() => handlePetChange(item)}
              >
                <span>{PET_ICONS[item] || "🐾"}</span> {item}
              </button>
            ))}
          </div>
        </div>

        <div className="search-filter-group">
          <p className="search-filter-label">Severity</p>

          <div className="search-sev-pills">
            {SEVERITIES.map((item) => {
              const style = SEVERITY_STYLES[item] || SEVERITY_STYLES.Moderate;
              const isActive = severity === item;

              return (
                <button
                  key={item}
                  type="button"
                  className={`search-sev-pill ${isActive ? "active" : ""}`}
                  style={
                    isActive
                      ? {
                          background: style.bg,
                          color: style.color,
                          borderColor: style.color,
                        }
                      : {}
                  }
                  onClick={() => handleSeverityChange(item)}
                >
                  {item}
                </button>
              );
            })}
          </div>
        </div>

        <div className="search-filter-group">
          <p className="search-filter-label">Search keyword</p>

          <div className="search-input-row">
            <div className="search-input-wrap">
              <svg
                className="search-input-icon"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>

              <input
                type="text"
                className="search-input"
                placeholder="e.g. choking, poison, bleeding..."
                value={search}
                onChange={(event) => handleSearchChange(event.target.value)}
              />

              {search && (
                <button
                  type="button"
                  className="search-input-clear"
                  onClick={() => handleSearchChange("")}
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          <div className="search-tags">
            {[
              "choking",
              "poisoning",
              "bleeding",
              "heatstroke",
              "broken bone",
            ].map((item) => (
              <span
                key={item}
                className={search === item ? "active" : ""}
                onClick={() => handleSearchChange(search === item ? "" : item)}
              >
                {item}
              </span>
            ))}
          </div>
        </div>

        {hasFilters && (
          <div className="search-active-row">
            <div className="search-active-filters">
              {pet !== "All Pets" && (
                <span className="search-active-tag">
                  {PET_ICONS[pet] || "🐾"} {pet}
                  <button
                    type="button"
                    onClick={() => handlePetChange("All Pets")}
                  >
                    ✕
                  </button>
                </span>
              )}

              {severity !== "All Severity" && (
                <span className="search-active-tag">
                  {severity}
                  <button
                    type="button"
                    onClick={() => handleSeverityChange("All Severity")}
                  >
                    ✕
                  </button>
                </span>
              )}

              {search && (
                <span className="search-active-tag">
                  "{search}"
                  <button type="button" onClick={() => handleSearchChange("")}>
                    ✕
                  </button>
                </span>
              )}
            </div>

            <button
              type="button"
              className="search-clear-all"
              onClick={clearSearch}
            >
              Clear all
            </button>
          </div>
        )}
      </section>

      <section className="search-results" ref={resultsRef}>
        <div className="search-results-header">
          <h2>
            {loading
              ? "Loading guides..."
              : filteredGuides.length === 0
              ? "No guides found"
              : `${filteredGuides.length} guide${
                  filteredGuides.length !== 1 ? "s" : ""
                } found`}
          </h2>

          {!loading && filteredGuides.length > 0 && (
            <p className="search-results-meta">
              Showing {(currentPage - 1) * GUIDES_PER_PAGE + 1}–
              {Math.min(currentPage * GUIDES_PER_PAGE, filteredGuides.length)}{" "}
              of {filteredGuides.length}
            </p>
          )}
        </div>

        {error && (
          <div className="search-empty">
            <div className="search-empty-icon">⚠️</div>
            <h3>Unable to load guides</h3>
            <p>{error}</p>

            <button
              type="button"
              className="search-empty-btn"
              onClick={retryLoadTopics}
            >
              Try again
            </button>
          </div>
        )}

        {!error && loading && (
          <div className="search-empty">
            <div className="search-empty-icon">⏳</div>
            <h3>Loading...</h3>
            <p>Please wait while we load emergency guides.</p>
          </div>
        )}

        {!error && !loading && filteredGuides.length > 0 ? (
          <>
            <div className="search-result-grid">
              {pagedGuides.map((guide) => {
                const guideId = String(guide.id);
                const isBookmarked = bookmarks.includes(guideId);
                const isUpdating = updatingBookmarkId === guideId;

                return (
                  <div
                    className={`search-result-card ${guide.color}`}
                    key={guide.id}
                  >
                    <div className="search-card-top">
                      <span className="search-card-icon">{guide.icon}</span>

                      <button
                        type="button"
                        className={`bookmark-btn ${
                          isBookmarked ? "bookmarked" : ""
                        } ${isUpdating ? "updating" : ""}`}
                        onClick={() => toggleBookmark(guide.id, guide.title)}
                        disabled={isUpdating}
                        title={
                          isBookmarked ? "Remove bookmark" : "Save bookmark"
                        }
                      >
                        {isUpdating ? "…" : isBookmarked ? "★" : "☆"}
                      </button>
                    </div>

                    <h3>{guide.title}</h3>

                    <div className="search-card-meta">
                      <span className="search-card-pet">{guide.pet}</span>

                      <span
                        className="search-card-severity"
                        style={{
                          background:
                            SEVERITY_STYLES[guide.severity]?.bg || "#f3f4f6",
                          color:
                            SEVERITY_STYLES[guide.severity]?.color ||
                            "#6b7280",
                        }}
                      >
                        {guide.severity}
                      </span>
                    </div>

                    {guide.desc && (
                      <p className="search-card-desc">{guide.desc}</p>
                    )}

                    <Link
                      to={`/guide-details/${guide.id}`}
                      className="search-card-btn"
                    >
                      View guide →
                    </Link>
                  </div>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div className="search-pagination">
                <button
                  type="button"
                  className="search-page-btn search-page-nav"
                  onClick={() => goToPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  ‹ Prev
                </button>

                <div className="search-page-numbers">
                  {getPageNumbers().map((page, index) =>
                    page === "..." ? (
                      <span
                        key={`ellipsis-${index}`}
                        className="search-page-ellipsis"
                      >
                        ...
                      </span>
                    ) : (
                      <button
                        key={page}
                        type="button"
                        className={`search-page-btn ${
                          currentPage === page ? "active" : ""
                        }`}
                        onClick={() => goToPage(page)}
                      >
                        {page}
                      </button>
                    )
                  )}
                </div>

                <button
                  type="button"
                  className="search-page-btn search-page-nav"
                  onClick={() =>
                    goToPage(Math.min(totalPages, currentPage + 1))
                  }
                  disabled={currentPage === totalPages}
                >
                  Next ›
                </button>
              </div>
            )}
          </>
        ) : (
          !error &&
          !loading && (
            <div className="search-empty">
              <div className="search-empty-icon">🔍</div>
              <h3>No guide found</h3>
              <p>Try a different keyword or reset your filters.</p>

              <button
                type="button"
                className="search-empty-btn"
                onClick={clearSearch}
              >
                Reset filters
              </button>
            </div>
          )
        )}
      </section>
    </main>
  );
}