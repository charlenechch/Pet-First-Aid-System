import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { availableQuizzes } from "../../data/petOwnerData";
import "../../styles/admin.css";
import "../../styles/petOwner.css";

function QuizList() {
  const navigate = useNavigate();
  const [searchKeyword, setSearchKeyword] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("All");

  const filteredQuizzes = useMemo(() => {
    return availableQuizzes.filter((quiz) => {
      const keyword = searchKeyword.toLowerCase();

      const matchesSearch =
        quiz.title.toLowerCase().includes(keyword) ||
        quiz.pet.toLowerCase().includes(keyword);

      const matchesDifficulty =
        difficultyFilter === "All" || quiz.difficulty === difficultyFilter;

      return matchesSearch && matchesDifficulty;
    });
  }, [searchKeyword, difficultyFilter]);

  function startQuiz(quizId) {
    navigate(`/petowner/quizzes/${quizId}/attempt`);
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

        {filteredQuizzes.length > 0 ? (
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

                <div className="quiz-card-footer">
                  {quiz.attempted ? (
                    <span className="quiz-card-best-score">
                      Best score: <strong>{quiz.bestScore}%</strong>
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
          <div className="petowner-empty-state">
            <span className="empty-icon">🧠</span>
            <p>No quizzes match your filter.</p>
          </div>
        )}
      </section>
    </div>
  );
}

export default QuizList;
