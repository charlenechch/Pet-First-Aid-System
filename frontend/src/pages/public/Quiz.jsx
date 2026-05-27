import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import "../../styles/quiz.css";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const LEVEL_STYLES = {
  green: { bg: "#EAF3DE", color: "#3B6D11" },
  amber: { bg: "#FAEEDA", color: "#854F0B" },
  red: { bg: "#FCEBEB", color: "#A32D2D" },
};

const LETTERS = ["A", "B", "C", "D", "E"];

function getLevelStyle(passMark) {
  const mark = Number(passMark || 0);

  if (mark >= 80) return { key: "red", label: "Advanced" };
  if (mark >= 70) return { key: "amber", label: "Intermediate" };

  return { key: "green", label: "Beginner" };
}

export default function Quiz() {
  const navigate = useNavigate();
  const { quizId } = useParams();

  const token = localStorage.getItem("token");

  const [quizList, setQuizList] = useState([]);
  const [listLoading, setListLoading] = useState(Boolean(token));
  const [listError, setListError] = useState("");

  const [selected, setSelected] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [quizLoading, setQuizLoading] = useState(false);

  const [cur, setCur] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [searchKeyword, setSearchKeyword] = useState("");

  async function readJson(response) {
    try {
      return await response.json();
    } catch {
      return {};
    }
  }

  async function requestWithToken(path, options = {}) {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...(options.headers || {}),
      },
    });

    const data = await readJson(response);

    if (response.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      navigate("/login", { replace: true });
      throw new Error("Please login again.");
    }

    if (!response.ok) {
      throw new Error(data.message || "Request failed.");
    }

    return data;
  }

  useEffect(() => {
    if (!token) return;

    let isCancelled = false;

    async function fetchQuizList() {
      try {
        const response = await fetch(`${API_BASE_URL}/api/petowner/quizzes`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await readJson(response);

        if (response.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/login", { replace: true });
          return;
        }

        if (!response.ok) {
          throw new Error(data.message || "Failed to load quizzes.");
        }

        if (!isCancelled) {
          setQuizList(data.quizzes || []);
          setListError("");
          setListLoading(false);
        }
      } catch (error) {
        if (!isCancelled) {
          console.error("Fetch quiz list error:", error);
          setListError(error.message || "Failed to load quizzes.");
          setListLoading(false);
        }
      }
    }

    fetchQuizList();

    return () => {
      isCancelled = true;
    };
  }, [token, navigate]);

  useEffect(() => {
    if (!token || !quizId || listLoading || quizList.length === 0) return;

    const matchedQuiz = quizList.find(
      (quiz) => String(quiz.quizID) === String(quizId)
    );

    if (!matchedQuiz || selected?.quizID === matchedQuiz.quizID) return;

    let isCancelled = false;

    async function openQuizFromUrl() {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/petowner/quizzes/${matchedQuiz.quizID}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await readJson(response);

        if (response.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/login", { replace: true });
          return;
        }

        if (!response.ok) {
          throw new Error(data.message || "Failed to load quiz.");
        }

        if (!isCancelled) {
          setSelected({
            ...matchedQuiz,
            ...data.quiz,
            icon: matchedQuiz.icon || data.quiz?.icon || "🐾",
            petName: matchedQuiz.petName || data.quiz?.petName || "Pet",
            topicTitle:
              matchedQuiz.topicTitle ||
              data.quiz?.topicTitle ||
              "First Aid Quiz",
          });

          setQuestions(data.questions || []);
          setCur(0);
          setAnswers({});
          setSubmitted(false);
          setResult(null);
        }
      } catch (error) {
        if (!isCancelled) {
          console.error("Open quiz from URL error:", error);
          alert(error.message || "Failed to load quiz.");
        }
      }
    }

    openQuizFromUrl();

    return () => {
      isCancelled = true;
    };
  }, [token, quizId, listLoading, quizList, selected?.quizID, navigate]);

  const filteredQuizList = useMemo(() => {
    const keyword = searchKeyword.toLowerCase().trim();

    if (!keyword) return quizList;

    return quizList.filter((quiz) => {
      return (
        String(quiz.quizTitle || "").toLowerCase().includes(keyword) ||
        String(quiz.topicTitle || "").toLowerCase().includes(keyword) ||
        String(quiz.petName || "").toLowerCase().includes(keyword) ||
        String(quiz.description || "").toLowerCase().includes(keyword)
      );
    });
  }, [quizList, searchKeyword]);

  const QS = questions;
  const filled = Object.keys(answers).length;
  const allDone = filled === QS.length && QS.length > 0;
  const isLast = cur === QS.length - 1;
  const currentQ = QS[cur];
  const currentAnswered =
    currentQ && answers[currentQ.questionID] !== undefined;

  const progressPercent = Math.round(
    ((submitted ? QS.length : filled) / (QS.length || 1)) * 100
  );

  async function startQuiz(quiz, fromDirectLink = false) {
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      setQuizLoading(true);

      const data = await requestWithToken(`/api/petowner/quizzes/${quiz.quizID}`);

      setSelected({
        ...quiz,
        ...data.quiz,
        icon: quiz.icon || data.quiz?.icon || "🐾",
        petName: quiz.petName || data.quiz?.petName || "Pet",
        topicTitle: quiz.topicTitle || data.quiz?.topicTitle || "First Aid Quiz",
      });

      setQuestions(data.questions || []);
      setCur(0);
      setAnswers({});
      setSubmitted(false);
      setResult(null);

      if (!fromDirectLink) {
        navigate(`/quiz/${quiz.quizID}`);
      }
    } catch (error) {
      console.error("Start quiz error:", error);
      alert(error.message || "Failed to load quiz.");
    } finally {
      setQuizLoading(false);
    }
  }

  function reset() {
    setSelected(null);
    setQuestions([]);
    setCur(0);
    setAnswers({});
    setSubmitted(false);
    setResult(null);
    navigate("/quiz");
  }

  function pick(questionID, answerID) {
    if (submitted) return;

    setAnswers((prev) => ({
      ...prev,
      [questionID]: answerID,
    }));
  }

  async function submitQuiz() {
    if (!selected || submitting) return;

    if (!allDone) {
      alert("Please answer all questions before submitting.");
      return;
    }

    try {
      setSubmitting(true);

      const data = await requestWithToken(
        `/api/petowner/quizzes/${selected.quizID}/submit`,
        {
          method: "POST",
          body: JSON.stringify({ answers }),
        }
      );

      setResult(data.result);
      setSubmitted(true);
    } catch (error) {
      console.error("Submit quiz error:", error);
      alert(error.message || "Failed to submit quiz.");
    } finally {
      setSubmitting(false);
    }
  }

  function getOptClass(questionID, answerID) {
    if (answers[questionID] === undefined) return "qz-opt";

    const reviewItem = result?.review?.find(
      (item) => Number(item.questionID) === Number(questionID)
    );

    const correctID = reviewItem?.correctAnswerID;
    const isCorrect = Number(answerID) === Number(correctID);
    const isChosen = Number(answers[questionID]) === Number(answerID);

    if (submitted && isCorrect) return "qz-opt qz-opt-correct";
    if (submitted && isChosen && !isCorrect) return "qz-opt qz-opt-wrong";
    if (!submitted && isChosen) return "qz-opt qz-opt-chosen";

    return submitted ? "qz-opt qz-opt-dim" : "qz-opt";
  }

  function goBack() {
    if (cur > 0) {
      setCur((prev) => prev - 1);
    }
  }

  function goNext() {
    if (cur < QS.length - 1) {
      setCur((prev) => prev + 1);
    }
  }

  const scoreCount = result?.correctCount ?? 0;
  const pctScore = result?.score ?? 0;
  const passed = result?.passed ?? false;

  const ringClass = passed
    ? "qz-score-ring passed"
    : pctScore >= 50
    ? "qz-score-ring middle"
    : "qz-score-ring failed";

  if (!token) {
    return (
      <main className="qz-public-page">
        <section className="qz-login-card">
          <div className="qz-login-icon">🔐</div>

          <p className="qz-eyebrow">Login Required</p>
          <h1>Login to Take Quizzes</h1>

          <p>
            Quizzes are only available for registered pet owners. Please login
            first so your quiz result can be saved into your profile.
          </p>

          <div className="qz-login-actions">
            <Link to="/login" className="qz-primary-link">
              Login Now
            </Link>

            <Link to="/register" className="qz-secondary-link">
              Create Account
            </Link>
          </div>
        </section>
      </main>
    );
  }

  if (listLoading || quizLoading) {
    return (
      <main className="qz-public-page">
        <section className="qz-loading-card">
          <div className="qz-loader"></div>
          <h2>{quizLoading ? "Opening Quiz..." : "Loading Quizzes..."}</h2>
          <p>Please wait while we prepare your quiz.</p>
        </section>
      </main>
    );
  }

  if (selected) {
    return (
      <main className="qz-public-page">
        <section className="qz-quiz-shell">
          <button type="button" className="qz-back-link" onClick={reset}>
            ← Back to Quizzes
          </button>

          <div className="qz-hero">
            <div className="qz-hero-icon">{selected.icon || "🐾"}</div>

            <div>
              <p className="qz-eyebrow">Pet First Aid Quiz</p>
              <h1>{selected.quizTitle}</h1>
              <p>
                {selected.topicTitle || "First Aid Topic"} · {QS.length}{" "}
                question{QS.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          <div className="qz-progress-area">
            <div className="qz-progress-top">
              <span>
                {submitted ? "Completed" : `${filled}/${QS.length} answered`}
              </span>
              <strong>{progressPercent}%</strong>
            </div>

            <div className="qz-progress-bar">
              <div
                className="qz-progress-fill"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          </div>

          <div className="qz-stepper">
            {QS.map((question, index) => {
              const reviewItem = result?.review?.find(
                (item) => Number(item.questionID) === Number(question.questionID)
              );

              let cls = "qz-dot";

              if (submitted) {
                cls += reviewItem?.isCorrect
                  ? " qz-dot-correct"
                  : " qz-dot-wrong";
              } else if (index === cur) {
                cls += " qz-dot-active";
              } else if (answers[question.questionID] !== undefined) {
                cls += " qz-dot-done";
              }

              return (
                <button
                  key={question.questionID}
                  type="button"
                  className={cls}
                  onClick={() => !submitted && setCur(index)}
                  aria-label={`Question ${index + 1}`}
                >
                  {submitted ? (reviewItem?.isCorrect ? "✓" : "✕") : index + 1}
                </button>
              );
            })}
          </div>

          {!submitted ? (
            <article className="qz-question-card">
              <span className="qz-qtag">
                Question {cur + 1} of {QS.length}
              </span>

              <h2>{currentQ?.questionText}</h2>

              <div className="qz-options">
                {currentQ?.answers.map((answer, index) => (
                  <button
                    key={answer.answerID}
                    type="button"
                    className={getOptClass(currentQ.questionID, answer.answerID)}
                    onClick={() => pick(currentQ.questionID, answer.answerID)}
                  >
                    <span className="qz-letter">{LETTERS[index]}</span>
                    <span>{answer.answerText}</span>
                  </button>
                ))}
              </div>

              {currentAnswered && (
                <div className="qz-note">
                  <strong>Answer saved.</strong>
                  <span>You can continue to the next question.</span>
                </div>
              )}

              <div className="qz-nav-row">
                <button
                  type="button"
                  className="qz-light-btn"
                  disabled={cur === 0}
                  onClick={goBack}
                >
                  ← Back
                </button>

                {isLast ? (
                  <button
                    type="button"
                    className="qz-main-btn"
                    disabled={!allDone || submitting}
                    onClick={submitQuiz}
                  >
                    {submitting ? "Submitting..." : "Submit Quiz"}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="qz-main-btn"
                    disabled={!currentAnswered}
                    onClick={goNext}
                  >
                    Next →
                  </button>
                )}
              </div>
            </article>
          ) : (
            <section className="qz-result-card">
              <div className="qz-result-header">
                <div className={ringClass}>
                  <strong>{pctScore}%</strong>
                  <span>
                    {scoreCount}/{QS.length}
                  </span>
                </div>

                <div>
                  <p className="qz-eyebrow">Quiz Result</p>
                  <h2>{passed ? "Passed! 🎉" : "Keep Practising"}</h2>
                  <p>
                    {passed
                      ? `Great job! You scored above the passing mark of ${
                          selected.pass_mark || 60
                        }%.`
                      : `You scored ${pctScore}%. The passing mark is ${
                          selected.pass_mark || 60
                        }%. You can try again anytime.`}
                  </p>
                </div>
              </div>

              <div className="qz-result-stats">
                <div>
                  <strong>{scoreCount}</strong>
                  <span>Correct</span>
                </div>

                <div>
                  <strong>{QS.length - scoreCount}</strong>
                  <span>Incorrect</span>
                </div>

                <div>
                  <strong>{pctScore}%</strong>
                  <span>Score</span>
                </div>
              </div>

              <div className="qz-review-list">
                {result?.review?.map((item, index) => (
                  <div
                    key={item.questionID}
                    className={
                      item.isCorrect
                        ? "qz-review-item correct"
                        : "qz-review-item wrong"
                    }
                  >
                    <div>
                      <span>{item.isCorrect ? "Correct" : "Incorrect"}</span>

                      <h3>
                        {index + 1}. {item.questionText}
                      </h3>
                    </div>

                    {!item.isCorrect && (
                      <p>
                        Correct answer: <strong>{item.correctAnswer}</strong>
                      </p>
                    )}
                  </div>
                ))}
              </div>

              <div className="qz-nav-row">
                <button
                  type="button"
                  className="qz-light-btn"
                  onClick={() => startQuiz(selected)}
                >
                  ↺ Try Again
                </button>

                <button type="button" className="qz-main-btn" onClick={reset}>
                  View All Quizzes
                </button>
              </div>
            </section>
          )}
        </section>
      </main>
    );
  }

  return (
    <main className="qz-public-page">
      <section className="qz-select-header">
        <p className="qz-eyebrow">Pet First Aid Learning</p>
        <h1>Quizzes</h1>
        <p>
          Test your knowledge, improve your emergency response skills, and save
          your results automatically.
        </p>

        <div className="qz-search-box">
          <input
            type="text"
            placeholder="Search by quiz title, pet, or topic..."
            value={searchKeyword}
            onChange={(event) => setSearchKeyword(event.target.value)}
          />
        </div>
      </section>

      {listError && (
        <section className="qz-message-card error">
          <h2>Unable to Load Quizzes</h2>
          <p>{listError}</p>
        </section>
      )}

      {!listError && filteredQuizList.length === 0 && (
        <section className="qz-message-card">
          <h2>No Quizzes Found</h2>
          <p>No quiz matches your search.</p>
        </section>
      )}

      {!listError && filteredQuizList.length > 0 && (
        <section className="qz-grid">
          {filteredQuizList.map((quiz) => {
            const level = getLevelStyle(quiz.pass_mark);
            const style = LEVEL_STYLES[level.key];

            return (
              <article key={quiz.quizID} className="qz-select-card">
                <div className="qz-card-top">
                  <div className="qz-card-icon">{quiz.icon || "🐾"}</div>

                  <span
                    className="qz-level"
                    style={{
                      background: style.bg,
                      color: style.color,
                    }}
                  >
                    {level.label}
                  </span>
                </div>

                <h2>{quiz.quizTitle}</h2>

                <p className="qz-topic">
                  {quiz.topicTitle || "First Aid Topic"}
                </p>

                <p className="qz-desc">
                  {quiz.description ||
                    `Test your knowledge about ${
                      quiz.topicTitle || "pet emergency care"
                    }.`}
                </p>

                <div className="qz-meta-row">
                  <span>🐾 {quiz.petName || "Pet"}</span>
                  <span>🎯 Pass {quiz.pass_mark || 60}%</span>
                </div>

                {Number(quiz.attempts || 0) > 0 && (
                  <div className="qz-best-score">
                    Best score: <strong>{quiz.bestScore ?? "-"}%</strong> ·{" "}
                    {quiz.attempts} attempt
                    {Number(quiz.attempts) !== 1 ? "s" : ""}
                  </div>
                )}

                <button
                  type="button"
                  className="qz-start-btn"
                  onClick={() => startQuiz(quiz)}
                >
                  Start Quiz →
                </button>
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}