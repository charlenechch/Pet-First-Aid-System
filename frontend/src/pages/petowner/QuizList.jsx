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

  // Load quiz results from backend database
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
          description: result.description || "",
          topicTitle: result.topicTitle || "First Aid Topic",
          pet: result.petName || "Pet",
          petEmoji: result.icon || "🐾",
          severity: result.severity || "-",
          score: Number(result.score || 0),
          totalQuestions: result.total_questions || "-",
          passed: Number(result.passed) === 1 || result.passed === true,
          passingScore: result.pass_mark || 60,
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
        result.topicTitle.toLowerCase().includes(keyword) ||
        result.pet.toLowerCase().includes(keyword) ||
        result.description.toLowerCase().includes(keyword);

      const matchesStatus =
        statusFilter === "All" ||
        (statusFilter === "Passed" && result.passed) ||
        (statusFilter === "Failed" && !result.passed);

      return matchesSearch && matchesStatus;
    });
  }, [quizResults, searchKeyword, statusFilter]);

  function goToQuiz(quizID) {
    navigate(`/petowner/quizzes/${quizID}/attempt`);
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
              View your completed quiz results from the database. You can also
              retake a quiz by clicking the button beside each result.
            </p>
          </div>
        </div>

        <div className="filter-row">
          <input
            type="text"
            placeholder="Search by quiz title, topic, or pet..."
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

        {!loading && !error && filteredResults.length > 0 ? (
          <div className="quiz-list-grid">
            {filteredResults.map((result) => (
              <article key={result.resultID} className="quiz-card">
                <div className="quiz-card-header">
                  <h3>{result.quizTitle}</h3>

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

                <div className="quiz-card-meta-row">
                  <span>
                    {result.petEmoji} <strong>{result.pet}</strong>
                  </span>

                  <span>
                    📚 <strong>{result.topicTitle}</strong>
                  </span>

                  <span>
                    ⚠️ <strong>{result.severity}</strong>
                  </span>
                </div>

                <div className="quiz-card-meta-row" style={{ marginTop: "10px" }}>
                  <span>
                    📝 Score: <strong>{result.score}%</strong>
                  </span>

                  <span>
                    📋 Questions: <strong>{result.totalQuestions}</strong>
                  </span>

                  <span>
                    🎯 Pass Mark: <strong>{result.passingScore}%</strong>
                  </span>
                </div>

                <p className="form-note" style={{ marginTop: "10px" }}>
                  Attempted on: {formatDate(result.attemptedAt)}
                </p>

                {result.description && (
                  <p className="form-note" style={{ marginTop: "8px" }}>
                    {result.description}
                  </p>
                )}

                <div className="quiz-card-footer">
                  <span className="quiz-card-best-score">
                    Result:{" "}
                    <strong>{result.passed ? "Completed successfully" : "Need more practice"}</strong>
                  </span>

                  <button
                    className="primary-btn"
                    onClick={() => goToQuiz(result.quizID)}
                  >
                    Retake Quiz
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          !loading &&
          !error && (
            <div className="petowner-empty-state">
              <span className="empty-icon">🧠</span>
              <p>No quiz results found.</p>
              <p className="form-note">
                After you complete a quiz, your result will appear here.
              </p>
            </div>
          )
        )}
      </section>
    </div>
  );
}

export default QuizList;