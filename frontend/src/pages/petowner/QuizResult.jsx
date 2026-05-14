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
          <p>
            No quiz result found. Try attempting a quiz first.
          </p>

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
    quizId,
    quizTitle,
    passingScore,
    score,
    correctCount,
    totalQuestions,
    result: resultLabel,
    answers,
    questions,
  } = result;

  const passed = resultLabel === "Passed";

  function getFeedbackMessage() {
    if (passed && score === 100) {
      return "Perfect score! You have mastered this topic. Great work.";
    }
    if (passed) {
      return "Well done! You passed the quiz and showed solid understanding.";
    }
    if (score >= passingScore - 15) {
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
          className={`quiz-result-score-circle ${passed ? "passed" : "failed"}`}
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
          <strong>{passingScore}%</strong>.
        </p>

        <div className="quiz-result-actions">
          <button
            className="primary-btn"
            onClick={() => navigate(`/petowner/quizzes/${quizId}/attempt`)}
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

        {questions.map((question, index) => {
          const userAnswer = answers[question.id];
          const isCorrect = userAnswer === question.correctAnswer;

          return (
            <div key={question.id} className="quiz-review-item">
              <p className="quiz-review-question">
                {index + 1}. {question.questionText}
              </p>

              <p
                className={`quiz-review-answer ${
                  isCorrect ? "correct" : "incorrect"
                }`}
              >
                <strong>Your answer:</strong>{" "}
                {userAnswer || "(no answer)"} {isCorrect ? "✓" : "✗"}
              </p>

              {!isCorrect && (
                <p className="quiz-review-answer correct">
                  <strong>Correct answer:</strong> {question.correctAnswer}
                </p>
              )}
            </div>
          );
        })}
      </section>
    </div>
  );
}

export default QuizResult;
