import { useLocation, useNavigate } from "react-router-dom";
import "../../styles/admin.css";
import "../../styles/petOwner.css";

function QuizResult() {
  const location = useLocation();
  const navigate = useNavigate();

  const result = location.state;

  if (!result) {
    return (
      <div className="admin-page">
        <div className="page-title-area">
          <p className="page-subtitle">Quiz Result</p>
          <h1>No Result To Show</h1>
        </div>

        <section className="admin-table-card">
          <p>No quiz result found. Try attempting a quiz first.</p>

          <button
            className="primary-btn"
            style={{ marginTop: "16px" }}
            onClick={() => navigate("/petowner/quizzes")}
          >
            Back to Quizzes
          </button>
        </section>
      </div>
    );
  }

  const {
    quizID,
    quizId,
    quizTitle,
    passingScore,
    score,
    passed,
    correctCount,
    totalQuestions,
    review,
  } = result;

  const finalQuizId = quizID || quizId;
  const finalPassingScore = passingScore || 60;
  const finalReview = Array.isArray(review) ? review : [];

  function getFeedbackMessage() {
    if (passed && score === 100) {
      return "Perfect score! You have mastered this topic. Great work.";
    }

    if (passed) {
      return "Well done! You passed the quiz and showed solid understanding.";
    }

    if (score >= finalPassingScore - 15) {
      return "Close one! Review the highlighted answers and try again.";
    }

    return "Don't worry — review the guide and re-attempt the quiz when you're ready.";
  }

  return (
    <div className="admin-page">
      <div className="page-title-row">
        <div className="page-title-area">
          <p className="page-subtitle">Quiz Result</p>
          <h1>{quizTitle}</h1>
        </div>
      </div>

      <section className="quiz-result-summary">
        <div
          className={`quiz-result-score-circle ${
            passed ? "passed" : "failed"
          }`}
        >
          <span className="quiz-result-score-value">{score}%</span>

          <span className="quiz-result-score-label">
            {passed ? "Passed" : "Failed"}
          </span>
        </div>

        <h2 className="quiz-result-title">
          {passed ? "Congratulations!" : "Keep Practising"}
        </h2>

        <p className="quiz-result-message">{getFeedbackMessage()}</p>

        <p className="quiz-result-message" style={{ marginBottom: "20px" }}>
          You got <strong>{correctCount}</strong> out of{" "}
          <strong>{totalQuestions}</strong> correct. Passing score is{" "}
          <strong>{finalPassingScore}%</strong>.
        </p>

        <div className="quiz-result-actions">
          <button
            className="primary-btn"
            onClick={() =>
              navigate(`/petowner/quizzes/${finalQuizId}/attempt`)
            }
          >
            Retry Quiz
          </button>

          <button
            className="secondary-btn"
            onClick={() => navigate("/petowner/quizzes")}
          >
            Back to Quiz List
          </button>
        </div>
      </section>

      <section className="quiz-result-review">
        <h2>Review Your Answers</h2>

        {finalReview.length > 0 ? (
          finalReview.map((item, index) => (
            <div key={item.questionID} className="quiz-review-item">
              <p className="quiz-review-question">
                {index + 1}. {item.questionText}
              </p>

              <p
                className={`quiz-review-answer ${
                  item.isCorrect ? "correct" : "incorrect"
                }`}
              >
                <strong>Your answer:</strong>{" "}
                {item.selectedAnswerText || item.selectedAnswer || "Selected answer"}{" "}
                {item.isCorrect ? "✓" : "✗"}
              </p>

              {!item.isCorrect && (
                <p className="quiz-review-answer correct">
                  <strong>Correct answer:</strong>{" "}
                  {item.correctAnswer || "Correct answer not available"}
                </p>
              )}
            </div>
          ))
        ) : (
          <div className="petowner-empty-state">
            <span className="empty-icon">📝</span>
            <p>No answer review available.</p>
          </div>
        )}
      </section>
    </div>
  );
}

export default QuizResult;