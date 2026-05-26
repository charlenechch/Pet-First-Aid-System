import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiRequest } from "../../api";
import "../../styles/admin.css";
import "../../styles/petOwner.css";

function QuizAttempt() {
  const { quizId } = useParams();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Load quiz and questions from backend
  useEffect(() => {
    let isCancelled = false;

    async function loadQuiz() {
      try {
        setLoading(true);
        setError("");

        console.log("Loading quiz attempt:", quizId);

        const data = await apiRequest(`/api/petowner/quizzes/${quizId}`);

        if (isCancelled) return;

        const formattedQuiz = {
          id: data.quiz.quizID,
          title: data.quiz.quizTitle,
          description: data.quiz.description || "",
          passingScore: data.quiz.pass_mark || 60,
        };

        const formattedQuestions = (data.questions || []).map((question) => ({
          id: question.questionID,
          questionText: question.questionText,
          answers: question.answers || [],
        }));

        console.log("Quiz loaded:", formattedQuiz);
        console.log("Questions loaded:", formattedQuestions);

        setQuiz(formattedQuiz);
        setQuestions(formattedQuestions);
        setCurrentIndex(0);
        setAnswers({});
      } catch (error) {
        if (isCancelled) return;

        console.error("Load quiz error:", error);
        setError(error.message || "Failed to load quiz.");
        setQuiz(null);
        setQuestions([]);
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    loadQuiz();

    return () => {
      isCancelled = true;
    };
  }, [quizId]);

  function selectAnswer(answerID) {
    if (!questions[currentIndex]) return;

    setAnswers((prev) => ({
      ...prev,
      [questions[currentIndex].id]: answerID,
    }));
  }

  function goNext() {
    const currentQuestion = questions[currentIndex];

    if (!currentQuestion) return;

    if (!answers[currentQuestion.id]) {
      alert("Please select an answer before continuing.");
      return;
    }

    setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1));
  }

  function goPrev() {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  }

  async function submitQuiz() {
    const currentQuestion = questions[currentIndex];

    if (!currentQuestion) return;

    if (!answers[currentQuestion.id]) {
      alert("Please select an answer before submitting.");
      return;
    }

    try {
      console.log("Submitting quiz answers:", answers);

      const data = await apiRequest(`/api/petowner/quizzes/${quiz.id}/submit`, {
        method: "POST",
        body: JSON.stringify({
          answers,
        }),
      });

      console.log("Quiz submit result:", data.result);

      navigate(`/petowner/quizzes/${quiz.id}/result`, {
        state: data.result,
      });
    } catch (error) {
      console.error("Submit quiz error:", error);
      alert(error.message || "Failed to submit quiz.");
    }
  }

  function exitQuiz() {
    const confirmExit = window.confirm(
      "Are you sure you want to exit? Your progress will be lost."
    );

    if (!confirmExit) return;

    navigate("/petowner/quizzes");
  }

  function retryLoadQuiz() {
    window.location.reload();
  }

  if (loading) {
    return (
      <div className="admin-page">
        <div className="page-title-area">
          <p className="page-subtitle">Quiz Attempt</p>
          <h1>Loading Quiz...</h1>
        </div>

        <section className="admin-table-card">
          <div className="petowner-empty-state">
            <span className="empty-icon">⏳</span>
            <p>Please wait while we load the quiz questions.</p>
          </div>
        </section>
      </div>
    );
  }

  if (error || !quiz || questions.length === 0) {
    return (
      <div className="admin-page">
        <div className="page-title-area">
          <p className="page-subtitle">Quiz</p>
          <h1>Quiz Not Found</h1>
        </div>

        <section className="admin-table-card">
          <div className="petowner-empty-state">
            <span className="empty-icon">⚠️</span>
            <p>
              {error ||
                "We could not find this quiz. Please go back and pick another one."}
            </p>

            <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
              <button className="primary-btn" onClick={retryLoadQuiz}>
                Try Again
              </button>

              <button
                className="secondary-btn"
                onClick={() => navigate("/petowner/quizzes")}
              >
                Back to Quizzes
              </button>
            </div>
          </div>
        </section>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];

  const isLastQuestion = currentIndex === questions.length - 1;

  const progressPercent = Math.round(
    ((currentIndex + 1) / questions.length) * 100
  );

  return (
    <div className="admin-page">
      <div className="page-title-row">
        <div className="page-title-area">
          <p className="page-subtitle">Quiz Attempt</p>
          <h1>{quiz.title}</h1>
        </div>

        <button className="secondary-btn" onClick={exitQuiz}>
          Exit Quiz
        </button>
      </div>

      <section className="quiz-attempt-card">
        <div>
          <div className="quiz-progress-text">
            <span>
              Question {currentIndex + 1} of {questions.length}
            </span>

            <span>{progressPercent}%</span>
          </div>

          <div className="quiz-progress-bar">
            <div
              className="quiz-progress-bar-fill"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>

        <p className="quiz-question-text">{currentQuestion.questionText}</p>

        <div className="quiz-option-list">
          {currentQuestion.answers.map((answer) => (
            <label
              key={answer.answerID}
              className={`quiz-option-item ${
                answers[currentQuestion.id] === answer.answerID
                  ? "selected"
                  : ""
              }`}
            >
              <input
                type="radio"
                name={`question-${currentQuestion.id}`}
                value={answer.answerID}
                checked={answers[currentQuestion.id] === answer.answerID}
                onChange={() => selectAnswer(answer.answerID)}
              />

              <span>{answer.answerText}</span>
            </label>
          ))}
        </div>

        <div className="quiz-attempt-actions">
          <button
            type="button"
            className="secondary-btn"
            onClick={goPrev}
            disabled={currentIndex === 0}
            style={{ opacity: currentIndex === 0 ? 0.5 : 1 }}
          >
            ← Previous
          </button>

          {isLastQuestion ? (
            <button type="button" className="primary-btn" onClick={submitQuiz}>
              Submit Quiz
            </button>
          ) : (
            <button type="button" className="primary-btn" onClick={goNext}>
              Next →
            </button>
          )}
        </div>
      </section>
    </div>
  );
}

export default QuizAttempt;