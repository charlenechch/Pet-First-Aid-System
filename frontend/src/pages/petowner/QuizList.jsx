import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../../api";
import "../../styles/admin.css";
import "../../styles/petOwner.css";

function QuizList() {
  const navigate = useNavigate();

  const [quizResults, setQuizResults] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isCancelled = false;

    async function loadQuizResults() {
      try {
        setLoading(true);
        setError("");

        const data = await apiRequest("/api/petowner/quiz-results");

        if (isCancelled) return;

        const formattedResults = (data.results || []).map((result) => ({
          resultID: result.resultID,
          quizID: result.quizID,
          quizTitle: result.quizTitle,
          pet: result.petName || "Pet",
          petEmoji: result.icon || "🐾",
          score: Number(result.score || 0),
          passed: Number(result.passed) === 1 || result.passed === true,
          attemptedAt: result.attempted_at,
        }));

        setQuizResults(formattedResults);
      } catch (error) {
        if (isCancelled) return;

        console.error("Load quiz results error:", error);
        setError(error.message || "Failed to load quiz results.");
        setQuizResults([]);
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    loadQuizResults();

    return () => {
      isCancelled = true;
    };
  }, []);

  const filteredResults = useMemo(() => {
    return quizResults.filter((result) => {
      const keyword = searchKeyword.toLowerCase();

      const matchesSearch =
        result.quizTitle.toLowerCase().includes(keyword) ||
        result.pet.toLowerCase().includes(keyword);

      const matchesStatus =
        statusFilter === "All" ||
        (statusFilter === "Passed" && result.passed) ||
        (statusFilter === "Failed" && !result.passed);

      return matchesSearch && matchesStatus;
    });
  }, [quizResults, searchKeyword, statusFilter]);
function goToPublicQuizPage(quizID) {
  navigate(`/quiz/${quizID}`);
}
  function formatDate(dateValue) {
    if (!dateValue) return "-";

    return new Date(dateValue).toLocaleString("en-MY", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function retryLoadResults() {
    window.location.reload();
  }

  return (
    <div className="admin-page">
      <div className="page-title-row">
        <div className="page-title-area">
          <p className="page-subtitle">Quiz Performance</p>
          <h1>My Quiz Results</h1>
        </div>
      </div>

      <section className="admin-table-card">
        <div className="table-header-row">
          <div>
            <h2>Quiz Result History</h2>
            <p className="form-note">
              View your quiz percentage result. Click the quiz button if you
              want to do the quiz again.
            </p>
          </div>
        </div>

        <div className="filter-row">
          <input
            type="text"
            placeholder="Search by quiz title or pet..."
            value={searchKeyword}
            onChange={(event) => setSearchKeyword(event.target.value)}
          />

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="All">All Results</option>
            <option value="Passed">Passed</option>
            <option value="Failed">Failed</option>
          </select>
        </div>

        {loading && (
          <div className="petowner-empty-state">
            <span className="empty-icon">⏳</span>
            <p>Loading quiz results...</p>
          </div>
        )}

        {!loading && error && (
          <div className="petowner-empty-state">
            <span className="empty-icon">⚠️</span>
            <p>{error}</p>

            <button className="primary-btn" onClick={retryLoadResults}>
              Try Again
            </button>
          </div>
        )}

        {!loading && !error && filteredResults.length > 0 && (
          <div className="quiz-result-compact-grid">
            {filteredResults.map((result) => (
              <article key={result.resultID} className="quiz-result-compact-card">
                <div className="quiz-result-top">
                  <div>
                    <h3>{result.quizTitle}</h3>
                    <p>
                      {result.petEmoji} {result.pet}
                    </p>
                  </div>

                  <span
                    className={
                      result.passed
                        ? "status-badge published"
                        : "status-badge archived"
                    }
                  >
                    {result.passed ? "Passed" : "Failed"}
                  </span>
                </div>

                <div className="quiz-score-row">
                  <div className="quiz-score-circle">
                    <strong>{result.score}%</strong>
                  </div>

                  <div className="quiz-score-info">
                    <span>Your Score</span>
                    <p>Attempted on {formatDate(result.attemptedAt)}</p>
                  </div>
                </div>

                <button
  type="button"
  className="primary-btn quiz-result-link-btn"
  onClick={() => goToPublicQuizPage(result.quizID)}
>
  Go to This Quiz
</button>
              </article>
            ))}
          </div>
        )}

        {!loading && !error && filteredResults.length === 0 && (
          <div className="petowner-empty-state">
            <span className="empty-icon">🧠</span>
            <p>No quiz results found.</p>
            <p className="form-note">
              After you complete a quiz, your result will appear here.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

export default QuizList;