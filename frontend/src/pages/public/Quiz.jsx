import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL;

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
  const [petFilter, setPetFilter] = useState("All");

  async function readJson(response) {
    try {
      return await response.json();
    } catch {
      return {};
    }
  }

  const handleUnauthorized = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login", { replace: true });
  }, [navigate]);

  const buildQuizState = useCallback((quiz, data) => {
    return {
      ...quiz,
      ...data.quiz,
      icon: quiz.icon || data.quiz?.icon || "🐾",
      petName: quiz.petName || data.quiz?.petName || "Pet",
      topicTitle: quiz.topicTitle || data.quiz?.topicTitle || "First Aid Quiz",
    };
  }, []);

  useEffect(() => {
    if (!token) return;

    let isCancelled = false;

    async function fetchQuizList() {
      try {
        const response = await fetch(`${API_URL}/api/petowner/quizzes`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await readJson(response);

        if (isCancelled) return;

        if (response.status === 401) {
          handleUnauthorized();
          return;
        }

        if (!response.ok) {
          throw new Error(data.message || "Failed to load quizzes.");
        }

        setQuizList(data.quizzes || []);
        setListError("");
      } catch (error) {
        if (!isCancelled) {
          console.error("Fetch quiz list error:", error);
          setListError(error.message || "Failed to load quizzes.");
        }
      } finally {
        if (!isCancelled) {
          setListLoading(false);
        }
      }
    }

    fetchQuizList();

    return () => {
      isCancelled = true;
    };
  }, [token, handleUnauthorized]);

  useEffect(() => {
    if (!token || !quizId || listLoading || quizList.length === 0) return;

    const matchedQuiz = quizList.find(
      (quiz) => String(quiz.quizID) === String(quizId)
    );

    if (!matchedQuiz) return;

    if (selected && String(selected.quizID) === String(matchedQuiz.quizID)) {
      return;
    }

    let isCancelled = false;

    async function fetchDirectQuiz() {
      try {
        const response = await fetch(
          `${API_URL}/api/petowner/quizzes/${matchedQuiz.quizID}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await readJson(response);

        if (isCancelled) return;

        if (response.status === 401) {
          handleUnauthorized();
          return;
        }

        if (!response.ok) {
          throw new Error(data.message || "Failed to load quiz.");
        }

        setSelected(buildQuizState(matchedQuiz, data));
        setQuestions(data.questions || []);
        setCur(0);
        setAnswers({});
        setSubmitted(false);
        setResult(null);
      } catch (error) {
        if (!isCancelled) {
          console.error("Open direct quiz error:", error);
          alert(error.message || "Failed to load quiz.");
        }
      }
    }

    fetchDirectQuiz();

    return () => {
      isCancelled = true;
    };
  }, [
    token,
    quizId,
    listLoading,
    quizList,
    selected,
    handleUnauthorized,
    buildQuizState,
  ]);

  const petOptions = useMemo(() => {
    const uniquePets = [
      ...new Set(
        quizList
          .map((quiz) => quiz.petName)
          .filter((petName) => petName && petName.trim() !== "")
      ),
    ];

    return ["All", ...uniquePets];
  }, [quizList]);

  const filteredQuizList = useMemo(() => {
    const keyword = searchKeyword.toLowerCase().trim();

    return quizList.filter((quiz) => {
      const matchesSearch =
        keyword === "" ||
        String(quiz.quizTitle || "").toLowerCase().includes(keyword) ||
        String(quiz.topicTitle || "").toLowerCase().includes(keyword) ||
        String(quiz.description || "").toLowerCase().includes(keyword) ||
        String(quiz.petName || "").toLowerCase().includes(keyword);

      const matchesPet = petFilter === "All" || quiz.petName === petFilter;

      return matchesSearch && matchesPet;
    });
  }, [quizList, searchKeyword, petFilter]);

  async function startQuiz(quiz) {
    if (!token) {
      navigate("/login");
      return;
    }

    setQuizLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/api/petowner/quizzes/${quiz.quizID}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await readJson(response);

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok) {
        throw new Error(data.message || "Failed to load quiz.");
      }

      setSelected(buildQuizState(quiz, data));
      setQuestions(data.questions || []);
      setCur(0);
      setAnswers({});
      setSubmitted(false);
      setResult(null);

      navigate(`/quiz/${quiz.quizID}`);
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

  const QS = questions;
  const filled = Object.keys(answers).length;
  const allDone = filled === QS.length && QS.length > 0;
  const isLast = cur === QS.length - 1;
  const pct = Math.round(
    ((submitted ? QS.length : filled) / (QS.length || 1)) * 100
  );
  const currentQ = QS[cur];
  const currentAnswered =
    currentQ && answers[currentQ.questionID] !== undefined;

  async function submitQuiz() {
    if (submitting || !selected) return;

    if (!allDone) {
      alert("Please answer all questions before submitting.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(
        `${API_URL}/api/petowner/quizzes/${selected.quizID}/submit`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ answers }),
        }
      );

      const data = await readJson(response);

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok) {
        throw new Error(data.message || "Failed to submit quiz.");
      }

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
    const q = QS.find((item) => Number(item.questionID) === Number(questionID));

    if (!q || answers[questionID] === undefined) return "qz-opt";

    const reviewItem = result?.review?.find(
      (item) => Number(item.questionID) === Number(questionID)
    );

    const correctID = reviewItem?.correctAnswerID;
    const isCorrect = Number(answerID) === Number(correctID);
    const isChosen = Number(answers[questionID]) === Number(answerID);

    if (submitted && isCorrect) return "qz-opt qz-opt-correct";
    if (isChosen && submitted && !isCorrect) return "qz-opt qz-opt-wrong";
    if (isChosen && !submitted) return "qz-opt qz-opt-chosen";

    return "qz-opt qz-opt-dim";
  }

  if (!token) {
    return (
      <main className="qz-select-page">
        <div className="qz-select-header">
          <h1>Quizzes</h1>
          <p>Test your pet first-aid knowledge and track your progress</p>
          <p style={{ marginTop: 8, fontSize: 14, color: "#666" }}>
            <Link to="/login" style={{ color: "#2d6a4f", fontWeight: 600 }}>
              Login
            </Link>{" "}
            to take a quiz
          </p>
        </div>

        <div className="qz-select-grid">
          <div
            style={{
              gridColumn: "1/-1",
              textAlign: "center",
              padding: "3rem 0",
            }}
          >
            <p style={{ fontSize: 16, color: "#666" }}>
              Please{" "}
              <Link to="/login" style={{ color: "#2d6a4f", fontWeight: 600 }}>
                login
              </Link>{" "}
              to view and take quizzes.
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (listLoading || quizLoading) {
    return (
      <main className="qz-select-page">
        <div className="qz-select-grid">
          <p style={{ color: "#888" }}>
            {quizLoading ? "Opening quiz…" : "Loading quizzes…"}
          </p>
        </div>
      </main>
    );
  }

  if (!selected) {
    return (
      <main className="qz-select-page">
        <div className="qz-select-header">
          <h1>Quizzes</h1>
          <p>Test your pet first-aid knowledge and track your progress</p>
        </div>

        <div className="qz-filter-row">
          <input
            type="text"
            placeholder="Search quiz, topic, or pet..."
            value={searchKeyword}
            onChange={(event) => setSearchKeyword(event.target.value)}
          />

          <select
            value={petFilter}
            onChange={(event) => setPetFilter(event.target.value)}
          >
            {petOptions.map((pet) => (
              <option key={pet} value={pet}>
                {pet === "All" ? "All Pets" : pet}
              </option>
            ))}
          </select>
        </div>

        {listError && (
          <div className="qz-select-grid">
            <p style={{ color: "crimson" }}>{listError}</p>
          </div>
        )}

        {!listError && (
          <div className="qz-select-grid">
            {filteredQuizList.length === 0 && (
              <p style={{ color: "#888" }}>No quizzes match your search.</p>
            )}

            {filteredQuizList.map((quiz) => {
              const level = getLevelStyle(quiz.pass_mark);
              const lvl = LEVEL_STYLES[level.key];

              return (
                <div
                  key={quiz.quizID}
                  className="qz-select-card"
                  style={{ borderTop: `4px solid ${lvl.color}` }}
                >
                  <div className="qz-select-card-top">
                    <span className="qz-select-icon">{quiz.icon || "🐾"}</span>
                    <span className="qz-select-qs">{quiz.quizTitle}</span>
                  </div>

                  <h3 className="qz-select-title">
                    {quiz.topicTitle || "First Aid Quiz"}
                  </h3>

                  <p className="qz-select-desc">
                    {quiz.description ||
                      `Test your knowledge on ${
                        quiz.topicTitle || "pet first aid"
                      }.`}
                  </p>

                  <div className="qz-select-meta">
                    <span className="qz-select-time">
                      🐾 {quiz.petName || "Pet"}
                    </span>

                    <span
                      className="qz-select-level"
                      style={{
                        background: lvl.bg,
                        color: lvl.color,
                      }}
                    >
                      Pass: {quiz.pass_mark || 60}%
                    </span>
                  </div>

                  {Number(quiz.attempts || 0) > 0 && (
                    <p style={{ fontSize: 12, color: "#888", marginBottom: 8 }}>
                      Best score: {quiz.bestScore}% · {quiz.attempts} attempt
                      {Number(quiz.attempts) !== 1 ? "s" : ""}
                    </p>
                  )}

                  <button
                    type="button"
                    className="qz-start-btn"
                    onClick={() => startQuiz(quiz)}
                    disabled={quizLoading}
                  >
                    {quizLoading ? "Loading…" : "Start Quiz →"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </main>
    );
  }

  const scoreCount = result?.correctCount ?? 0;
  const pctScore = result?.score ?? 0;
  const passed = result?.passed ?? false;
  const ringColor = passed ? "#639922" : pctScore >= 50 ? "#BA7517" : "#E24B4A";
  const ringBg = passed ? "#EAF3DE" : pctScore >= 50 ? "#FAEEDA" : "#FCEBEB";

  return (
    <main className="qz-wrap">
      <button type="button" className="qz-back-btn" onClick={reset}>
        ← Back to Quizzes
      </button>

      <div className="qz-hero">
        <div className="qz-hero-icon">
          <span className="qz-hero-emoji">{selected.icon || "🐾"}</span>
        </div>

        <div>
          <h1 className="qz-hero-title">{selected.quizTitle}</h1>
          <p className="qz-hero-sub">
            {selected.topicTitle || "First Aid Quiz"} — {QS.length} question
            {QS.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      <div className="qz-prog-row">
        <div className="qz-prog-bar">
          <div className="qz-prog-fill" style={{ width: `${pct}%` }} />
        </div>

        <span className="qz-prog-label">
          {submitted ? "Complete" : `${filled}/${QS.length} answered`}
        </span>
      </div>

      <div className="qz-stepper">
        {QS.map((q, i) => {
          const reviewItem = result?.review?.find(
            (item) => Number(item.questionID) === Number(q.questionID)
          );

          let cls = "qz-dot";

          if (submitted) {
            cls += reviewItem?.isCorrect ? " qz-dot-done" : " qz-dot-wrong";
          } else if (i === cur) {
            cls += " qz-dot-active";
          } else if (answers[q.questionID] !== undefined) {
            cls += " qz-dot-done";
          }

          return (
            <button
              key={q.questionID}
              type="button"
              className={cls}
              onClick={() => !submitted && setCur(i)}
              aria-label={`Question ${i + 1}`}
            >
              {answers[q.questionID] !== undefined || submitted
                ? submitted
                  ? reviewItem?.isCorrect
                    ? "✓"
                    : "✗"
                  : "✓"
                : i + 1}
            </button>
          );
        })}
      </div>

      {!submitted ? (
        <div className="qz-pane">
          <span className="qz-qtag">
            Question {cur + 1} of {QS.length}
          </span>

          <p className="qz-qtext">{currentQ?.questionText}</p>

          <div className="qz-opts">
            {currentQ?.answers.map((ans, oi) => (
              <button
                key={ans.answerID}
                type="button"
                className={getOptClass(currentQ.questionID, ans.answerID)}
                onClick={() => pick(currentQ.questionID, ans.answerID)}
              >
                <span className="qz-opt-letter">{LETTERS[oi]}</span>
                <span>{ans.answerText}</span>
              </button>
            ))}
          </div>

          {currentAnswered && (
            <div className="qz-feedback qz-feedback-chosen">
              <span className="qz-feedback-icon">📝</span>
              <div>
                <strong>Answer recorded</strong>
                Move to the next question or submit when done.
              </div>
            </div>
          )}

          <div className="qz-nav">
            <button
              type="button"
              className="qz-nbtn"
              disabled={cur === 0}
              onClick={() => setCur((prev) => prev - 1)}
            >
              ← Back
            </button>

            {isLast ? (
              <button
                type="button"
                className="qz-nbtn qz-nbtn-submit"
                disabled={!allDone || submitting}
                onClick={submitQuiz}
              >
                {submitting ? "Submitting…" : "Submit quiz ✓"}
              </button>
            ) : (
              <button
                type="button"
                className="qz-nbtn qz-nbtn-primary"
                disabled={answers[currentQ?.questionID] === undefined}
                onClick={() => setCur((prev) => prev + 1)}
              >
                Next →
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="qz-result-wrap">
          <div className="qz-result-banner">
            <svg
              width="72"
              height="72"
              viewBox="0 0 72 72"
              className="qz-ring"
              aria-hidden="true"
            >
              <circle
                cx="36"
                cy="36"
                r="28"
                fill={ringBg}
                stroke={ringColor}
                strokeWidth="1"
              />

              <text
                x="36"
                y="33"
                textAnchor="middle"
                fontSize="18"
                fontWeight="500"
                fill={ringColor}
                fontFamily="sans-serif"
              >
                {scoreCount}/{QS.length}
              </text>

              <text
                x="36"
                y="47"
                textAnchor="middle"
                fontSize="11"
                fill={ringColor}
                fontFamily="sans-serif"
              >
                {pctScore}%
              </text>
            </svg>

            <div className="qz-result-info">
              <h2 className="qz-result-title">
                {passed ? "Passed! 🎉" : "Not quite — keep practising"}
              </h2>

              <p className="qz-result-msg">
                {passed
                  ? `You scored ${pctScore}% — above the passing mark of ${
                      selected.pass_mark || 60
                    }%.`
                  : `You scored ${pctScore}% — the passing mark is ${
                      selected.pass_mark || 60
                    }%. Try again!`}
              </p>

              <div className="qz-stats">
                <div className="qz-stat">
                  <span className="qz-stat-n qz-stat-green">{scoreCount}</span>
                  <span className="qz-stat-l">Correct</span>
                </div>

                <div className="qz-stat">
                  <span className="qz-stat-n qz-stat-red">
                    {QS.length - scoreCount}
                  </span>
                  <span className="qz-stat-l">Incorrect</span>
                </div>

                <div className="qz-stat">
                  <span className="qz-stat-n">{pctScore}%</span>
                  <span className="qz-stat-l">Score</span>
                </div>
              </div>
            </div>
          </div>

          <div className="qz-review-list">
            {result?.review?.map((item) => (
              <div
                key={item.questionID}
                className={`qz-rev-item ${
                  item.isCorrect ? "qz-rev-ok" : "qz-rev-bad"
                }`}
              >
                <div className="qz-rev-q">
                  <span
                    className={`qz-rev-badge ${
                      item.isCorrect ? "qz-badge-ok" : "qz-badge-bad"
                    }`}
                  >
                    {item.isCorrect ? "Correct" : "Incorrect"}
                  </span>

                  {item.questionText}
                </div>

                {!item.isCorrect && (
                  <p className="qz-rev-ans">
                    Correct answer: <strong>{item.correctAnswer}</strong>
                  </p>
                )}
              </div>
            ))}
          </div>

          <div className="qz-result-actions">
            <button
              type="button"
              className="qz-nbtn"
              onClick={() => startQuiz(selected)}
            >
              ↺ Try again
            </button>

            <button
              type="button"
              className="qz-nbtn qz-nbtn-primary"
              onClick={reset}
            >
              ← All Quizzes
            </button>
          </div>
        </div>
      )}
    </main>
  );
}