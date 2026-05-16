import { useMemo, useState } from "react";
import { bookmarkedTopics as initialBookmarks } from "../../data/petOwnerData";
import "../../styles/admin.css";
import "../../styles/petOwner.css";

function Bookmark() {
  const [bookmarks, setBookmarks] = useState(initialBookmarks);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [petFilter, setPetFilter] = useState("All");

  const petOptions = useMemo(() => {
    const pets = new Set(initialBookmarks.map((bookmark) => bookmark.pet));
    return ["All", ...Array.from(pets)];
  }, []);

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

  function removeBookmark(id) {
    const confirmRemove = window.confirm("Remove this topic from bookmarks?");

    if (!confirmRemove) return;

    setBookmarks((prev) => prev.filter((bookmark) => bookmark.id !== id));
  }

  function openTopic(bookmark) {
    alert(`Open guide for "${bookmark.title}". (Hardcoded for now.)`);
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

        {filteredBookmarks.length > 0 ? (
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
          <div className="petowner-empty-state">
            <span className="empty-icon">🔖</span>
            <p>No bookmarks found. Try a different search or pet filter.</p>
          </div>
        )}
      </section>
    </div>
  );
}

export default Bookmark;
