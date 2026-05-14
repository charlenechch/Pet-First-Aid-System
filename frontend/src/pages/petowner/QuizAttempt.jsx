import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { availableQuizzes, quizQuestions } from "../../data/petOwnerData";
import "../../styles/admin.css";
import "../../styles/petOwner.css";

function QuizAttempt() {
  const { quizId } = useParams();
  const navigate = useNavigate();

  const numericQuizId = Number(quizId);

  const quiz = useMemo(
    () => availableQuizzes.find((item) => item.id === numericQuizId),
    [numericQuizId]
  );

  const questions = useMemo(
    () => quizQuestions[numericQuizId] || [],
    [numericQuizId]
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});

  if (!quiz || questions.length === 0) {
    return (
      <div className="admin-page">
        <div className="page-title-area">
          <p className="page-subtitle">Quiz</p>
          <h1>Quiz Not Found</h1>
        </div>

        <section className="admin-table-card">
          <p>
            We could not find this quiz. Please go back and pick another one.
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

  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;
  const progressPercent = Math.round(
    ((currentIndex + 1) / questions.length) * 100
  );

  function selectAnswer(option) {
    setAnswers({ ...answers, [currentQuestion.id]: option });
  }

  function goNext() {
    if (!answers[currentQuestion.id]) {
      alert("Please select an answer before continuing.");
      return;
    }

    setCurrentIndex((prev) => prev + 1);
  }

  function goPrev() {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  }

  function submitQuiz() {
    if (!answers[currentQuestion.id]) {
      alert("Please select an answer before submitting.");
      return;
    }

    let correctCount = 0;

    questions.forEach((question) => {
      if (answers[question.id] === question.correctAnswer) {
        correctCount += 1;
      }
    });

    const score = Math.round((correctCount / questions.length) * 100);
    const result = score >= quiz.passingScore ? "Passed" : "Failed";

    // Pass results via navigation state to the QuizResult page
    navigate(`/petowner/quizzes/${quiz.id}/result`, {
      state: {
        quizId: quiz.id,
        quizTitle: quiz.title,
        passingScore: quiz.passingScore,
        score,
        result,
        correctCount,
        totalQuestions: questions.length,
        answers,
        questions,
      },
    });
  }

  function exitQuiz() {
    const confirmExit = window.confirm(
      "Are you sure you want to exit? Your progress will be lost."
    );

    if (!confirmExit) return;

    navigate("/petowner/quizzes");
  }

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
          {currentQuestion.options.map((option) => (
            <label
              key={option}
              className={`quiz-option-item ${
                answers[currentQuestion.id] === option ? "selected" : ""
              }`}
            >
              <input
                type="radio"
                name={`question-${currentQuestion.id}`}
                value={option}
                checked={answers[currentQuestion.id] === option}
                onChange={() => selectAnswer(option)}
              />
              <span>{option}</span>
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
            <button
              type="button"
              className="primary-btn"
              onClick={submitQuiz}
            >
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
