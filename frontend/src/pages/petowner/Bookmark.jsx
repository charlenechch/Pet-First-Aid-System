import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../../api";
import "../../styles/admin.css";
import "../../styles/petOwner.css";

function Bookmark() {
  const navigate = useNavigate();

  const [bookmarks, setBookmarks] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [petFilter, setPetFilter] = useState("All");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Load bookmarks from backend database
  useEffect(() => {
    let isCancelled = false;

    async function loadBookmarks() {
      try {
        setLoading(true);
        setError("");

        console.log("Loading pet owner bookmarks...");

        const data = await apiRequest("/api/petowner/bookmarks");

        if (isCancelled) return;

        const formattedBookmarks = (data.bookmarks || []).map((bookmark) => ({
          id: bookmark.emergencyID,
          bookmarkID: bookmark.bookmarkID,
          title: bookmark.topicTitle,
          pet: bookmark.petName,
          petEmoji: bookmark.icon || "🐾",
          severity: bookmark.severity || "Moderate",
          summary: bookmark.topicDesc || "",
          savedAt: bookmark.saved_at
            ? new Date(bookmark.saved_at).toLocaleDateString()
            : "recently",
        }));

        console.log("Bookmarks loaded:", formattedBookmarks);

        setBookmarks(formattedBookmarks);
      } catch (error) {
        if (isCancelled) return;

        console.error("Load bookmarks error:", error);
        setError(error.message || "Failed to load bookmarks.");
        setBookmarks([]);
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    loadBookmarks();

    return () => {
      isCancelled = true;
    };
  }, []);

  const petOptions = useMemo(() => {
    const pets = new Set(bookmarks.map((bookmark) => bookmark.pet));
    return ["All", ...Array.from(pets)];
  }, [bookmarks]);

  const filteredBookmarks = useMemo(() => {
    return bookmarks.filter((bookmark) => {
      const keyword = searchKeyword.toLowerCase();

      const matchesSearch =
        bookmark.title.toLowerCase().includes(keyword) ||
        bookmark.summary.toLowerCase().includes(keyword) ||
        bookmark.pet.toLowerCase().includes(keyword);

      const matchesPet = petFilter === "All" || bookmark.pet === petFilter;

      return matchesSearch && matchesPet;
    });
  }, [bookmarks, searchKeyword, petFilter]);

  async function removeBookmark(id) {
    const confirmRemove = window.confirm("Remove this topic from bookmarks?");

    if (!confirmRemove) return;

    try {
      console.log("Removing bookmark emergencyID:", id);

      await apiRequest(`/api/petowner/bookmarks/${id}`, {
        method: "DELETE",
      });

      setBookmarks((prev) => prev.filter((bookmark) => bookmark.id !== id));

      console.log("Bookmark removed successfully.");
    } catch (error) {
      console.error("Remove bookmark error:", error);
      alert(error.message || "Failed to remove bookmark.");
    }
  }

  function openTopic(bookmark) {
    navigate(`/guide-details/${bookmark.id}`);
  }

  function retryLoadBookmarks() {
    window.location.reload();
  }

  return (
    <div className="admin-page">
      <div className="page-title-row">
        <div className="page-title-area">
          <p className="page-subtitle">Saved For Later</p>
          <h1>My Bookmarks</h1>
        </div>
      </div>

      <section className="admin-table-card">
        <div className="table-header-row">
          <div>
            <h2>Bookmarked Topics</h2>
            <p className="form-note">
              Your saved emergency topics. Open one to review the full guide,
              or remove it when you no longer need it.
            </p>
          </div>
        </div>

        <div className="filter-row">
          <input
            type="text"
            placeholder="Search by topic, pet, or keyword..."
            value={searchKeyword}
            onChange={(event) => setSearchKeyword(event.target.value)}
          />

          <select
            value={petFilter}
            onChange={(event) => setPetFilter(event.target.value)}
          >
            {petOptions.map((option) => (
              <option key={option} value={option}>
                {option === "All" ? "All Pets" : option}
              </option>
            ))}
          </select>
        </div>

        {loading && (
          <div className="petowner-empty-state">
            <span className="empty-icon">⏳</span>
            <p>Loading your bookmarks...</p>
          </div>
        )}

        {!loading && error && (
          <div className="petowner-empty-state">
            <span className="empty-icon">⚠️</span>
            <p>{error}</p>

            <button className="primary-btn" onClick={retryLoadBookmarks}>
              Try Again
            </button>
          </div>
        )}

        {!loading && !error && filteredBookmarks.length > 0 ? (
          <div className="bookmark-grid">
            {filteredBookmarks.map((bookmark) => (
              <article key={bookmark.id} className="bookmark-card">
                <div className="bookmark-card-header">
                  <h3>{bookmark.title}</h3>

                  <span
                    className={`severity-badge ${bookmark.severity.toLowerCase()}`}
                  >
                    {bookmark.severity}
                  </span>
                </div>

                <div className="bookmark-card-meta">
                  <span>
                    {bookmark.petEmoji} {bookmark.pet}
                  </span>
                </div>

                <p className="bookmark-card-summary">{bookmark.summary}</p>

                <div className="bookmark-card-footer">
                  <small>Saved {bookmark.savedAt}</small>

                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      className="primary-btn"
                      onClick={() => openTopic(bookmark)}
                    >
                      Open Guide
                    </button>

                    <button
                      className="bookmark-remove-btn"
                      onClick={() => removeBookmark(bookmark.id)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          !loading &&
          !error && (
            <div className="petowner-empty-state">
              <span className="empty-icon">🔖</span>
              <p>No bookmarks found. Try a different search or pet filter.</p>
            </div>
          )
        )}
      </section>
    </div>
  );
}

export default Bookmark;