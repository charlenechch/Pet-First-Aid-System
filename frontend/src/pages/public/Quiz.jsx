import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL;

const LEVEL_STYLES = {
  green:  { bg: "#EAF3DE", color: "#3B6D11" },
  amber:  { bg: "#FAEEDA", color: "#854F0B" },
  red:    { bg: "#FCEBEB", color: "#A32D2D" },
};

const LETTERS = ["A", "B", "C", "D", "E"];

function getLevelStyle(passMark) {
  if (passMark >= 80) return { key: "red",   label: "Advanced" };
  if (passMark >= 70) return { key: "amber", label: "Intermediate" };
  return                     { key: "green", label: "Beginner" };
}

export default function Quiz() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  // ── Selection screen state ────────────────────────────────
  const [quizList, setQuizList] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState("");

  // ── Active quiz state ─────────────────────────────────────
  const [selected, setSelected] = useState(null);   // quiz meta
  const [questions, setQuestions] = useState([]);    // [{questionID, questionText, answers:[{answerID,answerText}]}]
  const [quizLoading, setQuizLoading] = useState(false);
  const [cur, setCur] = useState(0);
  const [answers, setAnswers] = useState({});        // { questionID: answerID }
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);        // backend result object
  const [submitting, setSubmitting] = useState(false);

  // ── Fetch quiz list (requires login) ─────────────────────
  useEffect(() => {
    if (!token) { setListLoading(false); return; }
    async function fetchList() {
      try {
        const res = await fetch(`${API_URL}/api/petowner/quizzes`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to load quizzes.");
        setQuizList(data.quizzes || []);
      } catch (err) {
        setListError(err.message);
      } finally {
        setListLoading(false);
      }
    }
    fetchList();
  }, [token]);

  // ── Start quiz — fetch questions ──────────────────────────
  async function startQuiz(quiz) {
    if (!token) { navigate("/login"); return; }
    setQuizLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/petowner/quizzes/${quiz.quizID}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load quiz.");
      setSelected({ ...quiz, ...data.quiz });
      setQuestions(data.questions || []);
      setCur(0);
      setAnswers({});
      setSubmitted(false);
      setResult(null);
    } catch (err) {
      alert(err.message);
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
  }

  // ── Pick answer ───────────────────────────────────────────
  function pick(questionID, answerID) {
    if (submitted) return;
    if (answers[questionID] !== undefined) return; // answered once only
    setAnswers((prev) => ({ ...prev, [questionID]: answerID }));
  }

  // ── Submit quiz ───────────────────────────────────────────
  async function submitQuiz() {
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/petowner/quizzes/${selected.quizID}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ answers }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to submit quiz.");
      setResult(data.result);
      setSubmitted(true);
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  // ── Derived values ────────────────────────────────────────
  const QS = questions;
  const filled = Object.keys(answers).length;
  const allDone = filled === QS.length && QS.length > 0;
  const isLast = cur === QS.length - 1;
  const pct = Math.round((submitted ? QS.length : filled) / (QS.length || 1) * 100);
  const currentQ = QS[cur];
  const currentAnswered = currentQ && answers[currentQ.questionID] !== undefined;

  // ── Option style ──────────────────────────────────────────
  function getOptClass(questionID, answerID) {
    const q = QS.find((q) => q.questionID === questionID);
    if (!q || answers[questionID] === undefined) return "qz-opt";
    // find correct answerID from result review
    const reviewItem = result?.review?.find((r) => r.questionID === questionID);
    const correctID = reviewItem?.correctAnswerID;
    const isCorrect = answerID === correctID;
    const isChosen = answers[questionID] === answerID;
    if (submitted && isCorrect) return "qz-opt qz-opt-correct";
    if (isChosen && submitted && !isCorrect) return "qz-opt qz-opt-wrong";
    if (isChosen && !submitted) return "qz-opt qz-opt-chosen";
    return "qz-opt qz-opt-dim";
  }

  // ── SELECTION SCREEN ──────────────────────────────────────
  if (!selected) {
    return (
      <main className="qz-select-page">
        <div className="qz-select-header">
          <h1>Quizzes</h1>
          <p>Test your pet first-aid knowledge and track your progress</p>
          {!token && (
            <p style={{ marginTop: 8, fontSize: 14, color: "#666" }}>
              <Link to="/login" style={{ color: "#2d6a4f", fontWeight: 600 }}>Login</Link> to take a quiz
            </p>
          )}
        </div>

        {listLoading && <div className="qz-select-grid"><p style={{ color: "#888" }}>Loading quizzes…</p></div>}
        {listError && <div className="qz-select-grid"><p style={{ color: "crimson" }}>{listError}</p></div>}

        {!listLoading && !listError && (
          <div className="qz-select-grid">
            {quizList.length === 0 && token && <p style={{ color: "#888" }}>No quizzes available yet.</p>}
            {!token && (
              <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "3rem 0" }}>
                <p style={{ fontSize: 16, color: "#666" }}>Please <Link to="/login" style={{ color: "#2d6a4f", fontWeight: 600 }}>login</Link> to view and take quizzes.</p>
              </div>
            )}
            {quizList.map((quiz) => {
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

                  <h3 className="qz-select-title">{quiz.topicTitle}</h3>
                  <p className="qz-select-desc">{quiz.description || `Test your knowledge on ${quiz.topicTitle}.`}</p>

                  <div className="qz-select-meta">
                    <span className="qz-select-time">🐾 {quiz.petName}</span>
                    <span className="qz-select-level" style={{ background: lvl.bg, color: lvl.color }}>
                      Pass: {quiz.pass_mark}%
                    </span>
                  </div>

                  {quiz.attempts > 0 && (
                    <p style={{ fontSize: 12, color: "#888", marginBottom: 8 }}>
                      Best score: {quiz.bestScore}% · {quiz.attempts} attempt{quiz.attempts !== 1 ? "s" : ""}
                    </p>
                  )}

                  <button
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

  // ── QUIZ SCREEN ───────────────────────────────────────────
  const scoreCount = result?.correctCount ?? 0;
  const pctScore = result?.score ?? 0;
  const passed = result?.passed ?? false;
  const ringColor = passed ? "#639922" : pctScore >= 50 ? "#BA7517" : "#E24B4A";
  const ringBg    = passed ? "#EAF3DE" : pctScore >= 50 ? "#FAEEDA" : "#FCEBEB";

  return (
    <main className="qz-wrap">
      <style>{`
        .qz-opt-chosen { border-color: #2d6a4f !important; background: #f0f7ec !important; }
        .qz-opt-correct { border-color: #639922 !important; background: #EAF3DE !important; color: #27500A !important; }
        .qz-opt-correct .qz-opt-letter { background: #639922; border-color: #639922; color: #fff; opacity: 1 !important; }
        .qz-opt-wrong { border-color: #E24B4A !important; background: #FCEBEB !important; color: #A32D2D !important; }
        .qz-opt-wrong .qz-opt-letter { background: #E24B4A; border-color: #E24B4A; color: #fff; opacity: 1 !important; }
        .qz-opt-dim { opacity: 0.45; cursor: default; }
        .qz-opt[disabled], .qz-opt-correct, .qz-opt-wrong, .qz-opt-dim { cursor: default; pointer-events: none; }
        .qz-feedback { display: flex; gap: 10px; align-items: flex-start; padding: 12px 14px; border-radius: 10px; font-size: 13px; line-height: 1.5; margin-bottom: 1.25rem; animation: feedbackIn 0.25s ease; }
        @keyframes feedbackIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
        .qz-feedback-chosen { background: #f0f7ec; border: 1px solid #2d6a4f; color: #27500A; }
        .qz-feedback-icon { font-size: 16px; flex-shrink: 0; margin-top: 1px; }
        .qz-feedback strong { display: block; font-weight: 700; margin-bottom: 2px; }
      `}</style>

      <button className="qz-back-btn" onClick={reset}>← Back to Quizzes</button>

      <div className="qz-hero">
        <div className="qz-hero-icon">
          <span className="qz-hero-emoji">{selected.icon || "🐾"}</span>
        </div>
        <div>
          <h1 className="qz-hero-title">{selected.quizTitle}</h1>
          <p className="qz-hero-sub">{selected.topicTitle} — {QS.length} question{QS.length !== 1 ? "s" : ""}</p>
        </div>
      </div>

      <div className="qz-prog-row">
        <div className="qz-prog-bar">
          <div className="qz-prog-fill" style={{ width: `${pct}%` }} />
        </div>
        <span className="qz-prog-label">{submitted ? "Complete" : `${filled}/${QS.length} answered`}</span>
      </div>

      <div className="qz-stepper">
        {QS.map((q, i) => {
          const reviewItem = result?.review?.find((r) => r.questionID === q.questionID);
          let cls = "qz-dot";
          if (submitted) {
            cls += reviewItem?.isCorrect ? " qz-dot-done" : " qz-dot-wrong";
          } else if (i === cur) {
            cls += " qz-dot-active";
          } else if (answers[q.questionID] !== undefined) {
            cls += " qz-dot-done";
          }
          return (
            <button key={q.questionID} className={cls} onClick={() => !submitted && setCur(i)} aria-label={`Question ${i + 1}`}>
              {answers[q.questionID] !== undefined || submitted
                ? (submitted ? (reviewItem?.isCorrect ? "✓" : "✗") : "✓")
                : i + 1}
            </button>
          );
        })}
      </div>

      {!submitted ? (
        <div className="qz-pane">
          <span className="qz-qtag">Question {cur + 1} of {QS.length}</span>
          <p className="qz-qtext">{currentQ?.questionText}</p>
          <div className="qz-opts">
            {currentQ?.answers.map((ans, oi) => (
              <button
                key={ans.answerID}
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
              <div><strong>Answer recorded</strong>Move to the next question or submit when done.</div>
            </div>
          )}

          <div className="qz-nav">
            <button className="qz-nbtn" disabled={cur === 0} onClick={() => setCur(cur - 1)}>← Back</button>
            {isLast ? (
              <button className="qz-nbtn qz-nbtn-submit" disabled={!allDone || submitting} onClick={submitQuiz}>
                {submitting ? "Submitting…" : "Submit quiz ✓"}
              </button>
            ) : (
              <button className="qz-nbtn qz-nbtn-primary" disabled={answers[currentQ?.questionID] === undefined} onClick={() => setCur(cur + 1)}>
                Next →
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="qz-result-wrap">
          <div className="qz-result-banner">
            <svg width="72" height="72" viewBox="0 0 72 72" className="qz-ring" aria-hidden="true">
              <circle cx="36" cy="36" r="28" fill={ringBg} stroke={ringColor} strokeWidth="1" />
              <text x="36" y="33" textAnchor="middle" fontSize="18" fontWeight="500" fill={ringColor} fontFamily="sans-serif">{scoreCount}/{QS.length}</text>
              <text x="36" y="47" textAnchor="middle" fontSize="11" fill={ringColor} fontFamily="sans-serif">{pctScore}%</text>
            </svg>
            <div className="qz-result-info">
              <h2 className="qz-result-title">{passed ? "Passed! 🎉" : "Not quite — keep practising"}</h2>
              <p className="qz-result-msg">
                {passed
                  ? `You scored ${pctScore}% — above the passing mark of ${selected.pass_mark}%.`
                  : `You scored ${pctScore}% — the passing mark is ${selected.pass_mark}%. Try again!`}
              </p>
              <div className="qz-stats">
                <div className="qz-stat"><span className="qz-stat-n qz-stat-green">{scoreCount}</span><span className="qz-stat-l">Correct</span></div>
                <div className="qz-stat"><span className="qz-stat-n qz-stat-red">{QS.length - scoreCount}</span><span className="qz-stat-l">Incorrect</span></div>
                <div className="qz-stat"><span className="qz-stat-n">{pctScore}%</span><span className="qz-stat-l">Score</span></div>
              </div>
            </div>
          </div>

          <div className="qz-review-list">
            {result?.review?.map((item, i) => (
              <div key={item.questionID} className={`qz-rev-item ${item.isCorrect ? "qz-rev-ok" : "qz-rev-bad"}`}>
                <div className="qz-rev-q">
                  <span className={`qz-rev-badge ${item.isCorrect ? "qz-badge-ok" : "qz-badge-bad"}`}>
                    {item.isCorrect ? "Correct" : "Incorrect"}
                  </span>
                  {item.questionText}
                </div>
                {!item.isCorrect && (
                  <p className="qz-rev-ans">Correct answer: <strong>{item.correctAnswer}</strong></p>
                )}
              </div>
            ))}
          </div>

          <div className="qz-result-actions">
            <button className="qz-nbtn" onClick={() => startQuiz(selected)}>↺ Try again</button>
            <button className="qz-nbtn qz-nbtn-primary" onClick={reset}>← All Quizzes</button>
          </div>
        </div>
      )}
    </main>
  );
}