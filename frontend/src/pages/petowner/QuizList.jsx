import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../../api";
import "../../styles/admin.css";
import "../../styles/petOwner.css";

function QuizList() {
  const navigate = useNavigate();

  const [quizzes, setQuizzes] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("All");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Load quizzes from backend database
  useEffect(() => {
    let isCancelled = false;

    async function loadQuizzes() {
      try {
        setLoading(true);
        setError("");

        console.log("Loading quizzes from backend...");

        const data = await apiRequest("/api/petowner/quizzes");

        if (isCancelled) return;

        const formattedQuizzes = (data.quizzes || []).map((quiz) => ({
          id: quiz.quizID,
          title: quiz.quizTitle,
          description: quiz.description || "",
          pet: quiz.petName || "Pet",
          petEmoji: quiz.icon || "🐾",
          questions: quiz.totalQuestions || quiz.questionCount || "-",
          passingScore: quiz.pass_mark || quiz.passingScore || 60,
          difficulty: quiz.difficulty || "Beginner",
          attempted: Number(quiz.attempts || 0) > 0,
          bestScore:
            quiz.bestScore !== null && quiz.bestScore !== undefined
              ? quiz.bestScore
              : null,
        }));

        console.log("Quizzes loaded:", formattedQuizzes);

        setQuizzes(formattedQuizzes);
      } catch (error) {
        if (isCancelled) return;

        console.error("Load quizzes error:", error);
        setError(error.message || "Failed to load quizzes.");
        setQuizzes([]);
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    loadQuizzes();

    return () => {
      isCancelled = true;
    };
  }, []);

  const filteredQuizzes = useMemo(() => {
    return quizzes.filter((quiz) => {
      const keyword = searchKeyword.toLowerCase();

      const matchesSearch =
        quiz.title.toLowerCase().includes(keyword) ||
        quiz.pet.toLowerCase().includes(keyword) ||
        quiz.description.toLowerCase().includes(keyword);

      const matchesDifficulty =
        difficultyFilter === "All" || quiz.difficulty === difficultyFilter;

      return matchesSearch && matchesDifficulty;
    });
  }, [quizzes, searchKeyword, difficultyFilter]);

  function startQuiz(quizId) {
    navigate(`/petowner/quizzes/${quizId}/attempt`);
  }

  function retryLoadQuizzes() {
    window.location.reload();
  }

  return (
    <div className="admin-page">
      <div className="page-title-row">
        <div className="page-title-area">
          <p className="page-subtitle">Test Your Knowledge</p>
          <h1>Available Quizzes</h1>
        </div>
      </div>

      <section className="admin-table-card">
        <div className="table-header-row">
          <div>
            <h2>Pick a Quiz</h2>
            <p className="form-note">
              Each quiz is tied to a first-aid guide. Pass the quiz to confirm
              you have learned the key emergency steps.
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
            value={difficultyFilter}
            onChange={(event) => setDifficultyFilter(event.target.value)}
          >
            <option value="All">All Difficulty</option>
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>
        </div>

        {loading && (
          <div className="petowner-empty-state">
            <span className="empty-icon">⏳</span>
            <p>Loading quizzes...</p>
          </div>
        )}

        {!loading && error && (
          <div className="petowner-empty-state">
            <span className="empty-icon">⚠️</span>
            <p>{error}</p>

            <button className="primary-btn" onClick={retryLoadQuizzes}>
              Try Again
            </button>
          </div>
        )}

        {!loading && !error && filteredQuizzes.length > 0 ? (
          <div className="quiz-list-grid">
            {filteredQuizzes.map((quiz) => (
              <article key={quiz.id} className="quiz-card">
                <div className="quiz-card-header">
                  <h3>{quiz.title}</h3>
                  <span className="status-badge">{quiz.difficulty}</span>
                </div>

                <div className="quiz-card-meta-row">
                  <span>
                    {quiz.petEmoji} <strong>{quiz.pet}</strong>
                  </span>

                  <span>
                    📋 <strong>{quiz.questions}</strong> questions
                  </span>

                  <span>
                    🎯 Pass <strong>{quiz.passingScore}%</strong>
                  </span>
                </div>

                {quiz.description && (
                  <p className="form-note" style={{ marginTop: "10px" }}>
                    {quiz.description}
                  </p>
                )}

                <div className="quiz-card-footer">
                  {quiz.attempted ? (
                    <span className="quiz-card-best-score">
                      Best score:{" "}
                      <strong>
                        {quiz.bestScore !== null ? `${quiz.bestScore}%` : "-"}
                      </strong>
                    </span>
                  ) : (
                    <span className="quiz-card-best-score">Not attempted</span>
                  )}

                  <button
                    className="primary-btn"
                    onClick={() => startQuiz(quiz.id)}
                  >
                    {quiz.attempted ? "Retry" : "Start"}
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
              <p>No quizzes match your filter.</p>
            </div>
          )
        )}
      </section>
    </div>
  );
}

export default QuizList;