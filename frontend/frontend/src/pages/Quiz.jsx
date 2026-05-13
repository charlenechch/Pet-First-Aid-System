import { useState } from "react";

const QUIZ_SETS = [
  {
    id: "dog",
    icon: "🐶",
    title: "Dog First Aid Basics",
    desc: "Covers choking, bleeding, poisoning and heat emergencies.",
    time: "~8 minutes",
    level: "Beginner",
    levelColor: "green",
    borderColor: "#2d6a4f",
    questions: [
      {
        q: "What should you do first if your dog is choking?",
        opts: [
          "Stay calm and check the mouth safely",
          "Give random medicine",
          "Ignore it",
          "Force water into the mouth",
        ],
        a: "Stay calm and check the mouth safely",
        explanation: "Staying calm helps you think clearly. Carefully look inside the mouth and only remove the object if you can clearly see and safely reach it.",
      },
      {
        q: "What should you do during suspected poisoning?",
        opts: [
          "Force vomiting immediately",
          "Keep the poison packaging and call a vet",
          "Wait one day",
          "Give human medicine",
        ],
        a: "Keep the poison packaging and call a vet",
        explanation: "The packaging helps the vet identify the toxin quickly. Never induce vomiting without professional guidance — it can make some poisonings worse.",
      },
      {
        q: "Should PawGuard replace professional veterinary care?",
        opts: ["Yes", "No", "Only sometimes", "If the pet looks okay"],
        a: "No",
        explanation: "PawGuard provides first-aid guidance to stabilise your pet until you reach a vet. It is never a substitute for professional veterinary diagnosis and treatment.",
      },
    ],
  },
  {
    id: "cat",
    icon: "🐱",
    title: "Cat Emergency Care",
    desc: "Understand how to handle falls, toxins, and respiratory issues.",
    time: "~6 minutes",
    level: "Intermediate",
    levelColor: "amber",
    borderColor: "#d4700a",
    questions: [
      {
        q: "What is the first thing to do if your cat falls from a height?",
        opts: [
          "Keep it calm and check for injuries",
          "Give it food",
          "Let it run around",
          "Shake it to wake it up",
        ],
        a: "Keep it calm and check for injuries",
        explanation: "High-rise syndrome can cause internal injuries that aren't immediately visible. Keep your cat still and calm while you assess and contact a vet.",
      },
      {
        q: "Which common household item is toxic to cats?",
        opts: ["Carrots", "Lilies", "Plain rice", "Water"],
        a: "Lilies",
        explanation: "All parts of lily plants are highly toxic to cats and can cause acute kidney failure. Even small amounts — including pollen — can be life-threatening.",
      },
      {
        q: "If your cat stops breathing, what should you do?",
        opts: [
          "Wait and see",
          "Begin pet CPR and call a vet immediately",
          "Give it water",
          "Put it outside",
        ],
        a: "Begin pet CPR and call a vet immediately",
        explanation: "Start rescue breathing and chest compressions immediately. Every second counts in respiratory arrest. Call your vet or emergency clinic while performing CPR.",
      },
    ],
  },
  {
    id: "advanced",
    icon: "🩺",
    title: "Advanced Pet First Aid",
    desc: "CPR, fractures, anaphylaxis and multi-pet household safety.",
    time: "~10 minutes",
    level: "Advanced",
    levelColor: "red",
    borderColor: "#c0392b",
    questions: [
      {
        q: "What is the correct compression rate for pet CPR?",
        opts: [
          "30 compressions per minute",
          "100–120 compressions per minute",
          "10 compressions per minute",
          "50 compressions per minute",
        ],
        a: "100–120 compressions per minute",
        explanation: "This mirrors the human CPR rate. Maintain a steady rhythm — you can use a song like 'Stayin' Alive' (100 BPM) to keep pace. Compress one-third of the chest depth.",
      },
      {
        q: "What are signs of anaphylaxis in a pet?",
        opts: [
          "Sudden swelling, vomiting, and collapse",
          "Increased appetite",
          "Playful behaviour",
          "Sneezing once",
        ],
        a: "Sudden swelling, vomiting, and collapse",
        explanation: "Anaphylaxis is a severe allergic reaction that escalates rapidly. Facial swelling, hives, vomiting, difficulty breathing and collapse are key signs. Seek emergency vet care immediately.",
      },
      {
        q: "How should you immobilise a suspected fracture?",
        opts: [
          "Make the pet walk it off",
          "Splint carefully and transport to a vet",
          "Apply ice directly to the bone",
          "Massage the area",
        ],
        a: "Splint carefully and transport to a vet",
        explanation: "Improper movement can worsen fractures or cause nerve damage. Use padding and a rigid splint if available, keep your pet as still as possible, and transport to a vet urgently.",
      },
    ],
  },
];

const LETTERS = ["A", "B", "C", "D"];

const LEVEL_STYLES = {
  green: { bg: "#EAF3DE", color: "#3B6D11" },
  amber: { bg: "#FAEEDA", color: "#854F0B" },
  red:   { bg: "#FCEBEB", color: "#A32D2D" },
};

export default function Quiz() {
  const [selected, setSelected] = useState(null);
  const [cur, setCur] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const QS = selected ? selected.questions : [];
  const score = QS.filter((_, i) => answers[i] === QS[i].a).length;
  const filled = Object.keys(answers).length;
  const allDone = filled === QS.length;
  const isLast = cur === QS.length - 1;
  const pct = Math.round((submitted ? QS.length : filled) / (QS.length || 1) * 100);

  const ringColor = score === QS.length ? "#639922" : score >= 2 ? "#BA7517" : "#E24B4A";
  const ringBg    = score === QS.length ? "#EAF3DE" : score >= 2 ? "#FAEEDA" : "#FCEBEB";
  const pctScore  = Math.round((score / (QS.length || 1)) * 100);

  // Whether current question has been answered
  const currentAnswered = answers[cur] !== undefined;
  const currentCorrect = answers[cur] === QS[cur]?.a;

  function pick(o) {
    if (submitted) return;
    // Only allow answering once per question
    if (answers[cur] !== undefined) return;
    setAnswers({ ...answers, [cur]: o });
  }

  function startQuiz(set) {
    setSelected(set);
    setCur(0);
    setAnswers({});
    setSubmitted(false);
  }

  function reset() {
    setSelected(null);
    setCur(0);
    setAnswers({});
    setSubmitted(false);
  }

  function getOptClass(o) {
    let cls = "qz-opt";
    if (!currentAnswered) return cls; // no feedback yet

    const isCorrect = o === QS[cur].a;
    const isChosen = answers[cur] === o;

    if (isCorrect) return cls + " qz-opt-correct";
    if (isChosen && !isCorrect) return cls + " qz-opt-wrong";
    return cls + " qz-opt-dim";
  }

  /* ── SELECTION SCREEN ── */
  if (!selected) {
    return (
      <main className="qz-select-page">
        <div className="qz-select-header">
          <h1>Quizzes</h1>
          <p>Test your pet first-aid knowledge and track your progress</p>
        </div>

        <div className="qz-select-grid">
          {QUIZ_SETS.map((set) => {
            const lvl = LEVEL_STYLES[set.levelColor];
            return (
              <div
                key={set.id}
                className="qz-select-card"
                style={{ borderTop: `4px solid ${set.borderColor}` }}
              >
                <div className="qz-select-card-top">
                  <span className="qz-select-icon">{set.icon}</span>
                  <span className="qz-select-qs">{set.questions.length} Qs</span>
                </div>

                <h3 className="qz-select-title">{set.title}</h3>
                <p className="qz-select-desc">{set.desc}</p>

                <div className="qz-select-meta">
                  <span className="qz-select-time">⏱ {set.time}</span>
                  <span
                    className="qz-select-level"
                    style={{ background: lvl.bg, color: lvl.color }}
                  >
                    {set.level}
                  </span>
                </div>

                <button className="qz-start-btn" onClick={() => startQuiz(set)}>
                  Start Quiz →
                </button>
              </div>
            );
          })}
        </div>
      </main>
    );
  }

  /* ── QUIZ SCREEN ── */
  return (
    <main className="qz-wrap">
      <style>{`
        /* Immediate feedback option states */
        .qz-opt-correct {
          border-color: #639922 !important;
          background: #EAF3DE !important;
          color: #27500A !important;
        }
        .qz-opt-correct .qz-opt-letter {
          background: #639922;
          border-color: #639922;
          color: #fff;
          opacity: 1 !important;
        }
        .qz-opt-wrong {
          border-color: #E24B4A !important;
          background: #FCEBEB !important;
          color: #A32D2D !important;
        }
        .qz-opt-wrong .qz-opt-letter {
          background: #E24B4A;
          border-color: #E24B4A;
          color: #fff;
          opacity: 1 !important;
        }
        .qz-opt-dim {
          opacity: 0.45;
          cursor: default;
        }
        .qz-opt[disabled], .qz-opt-correct, .qz-opt-wrong, .qz-opt-dim {
          cursor: default;
          pointer-events: none;
        }

        /* Feedback banner */
        .qz-feedback {
          display: flex;
          gap: 10px;
          align-items: flex-start;
          padding: 12px 14px;
          border-radius: 10px;
          font-size: 13px;
          line-height: 1.5;
          margin-bottom: 1.25rem;
          animation: feedbackIn 0.25s ease;
        }
        @keyframes feedbackIn {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .qz-feedback-correct {
          background: #EAF3DE;
          border: 1px solid #97C459;
          color: #27500A;
        }
        .qz-feedback-wrong {
          background: #FCEBEB;
          border: 1px solid #F09595;
          color: #A32D2D;
        }
        .qz-feedback-icon {
          font-size: 16px;
          flex-shrink: 0;
          margin-top: 1px;
        }
        .qz-feedback strong {
          display: block;
          font-weight: 700;
          margin-bottom: 2px;
        }
      `}</style>

      {/* Back link */}
      <button className="qz-back-btn" onClick={reset}>← Back to Quizzes</button>

      {/* Hero */}
      <div className="qz-hero">
        <div className="qz-hero-icon">
          <span className="qz-hero-emoji" aria-hidden="true">{selected.icon}</span>
        </div>
        <div>
          <h1 className="qz-hero-title">{selected.title}</h1>
          <p className="qz-hero-sub">Test your emergency knowledge — {QS.length} quick questions.</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="qz-prog-row">
        <div className="qz-prog-bar">
          <div className="qz-prog-fill" style={{ width: `${pct}%` }} />
        </div>
        <span className="qz-prog-label">
          {submitted ? "Complete" : `${filled}/${QS.length} answered`}
        </span>
      </div>

      {/* Stepper dots */}
      <div className="qz-stepper">
        {QS.map((_, i) => {
          let cls = "qz-dot";
          if (submitted) {
            cls += answers[i] === QS[i].a ? " qz-dot-done" : " qz-dot-wrong";
          } else if (i === cur) {
            cls += " qz-dot-active";
          } else if (answers[i] !== undefined) {
            cls += answers[i] === QS[i].a ? " qz-dot-done" : " qz-dot-wrong";
          }
          return (
            <button
              key={i}
              className={cls}
              onClick={() => !submitted && setCur(i)}
              aria-label={`Question ${i + 1}`}
            >
              {answers[i] !== undefined || submitted
                ? (answers[i] === QS[i].a ? "✓" : "✗")
                : i + 1}
            </button>
          );
        })}
      </div>

      {/* Question pane */}
      {!submitted ? (
        <div className="qz-pane">
          <span className="qz-qtag">Question {cur + 1} of {QS.length}</span>
          <p className="qz-qtext">{QS[cur].q}</p>
          <div className="qz-opts">
            {QS[cur].opts.map((o, oi) => (
              <button
                key={o}
                className={getOptClass(o)}
                onClick={() => pick(o)}
              >
                <span className="qz-opt-letter">{LETTERS[oi]}</span>
                <span>{o}</span>
              </button>
            ))}
          </div>

          {/* Inline feedback after answering */}
          {currentAnswered && (
            <div className={`qz-feedback ${currentCorrect ? "qz-feedback-correct" : "qz-feedback-wrong"}`}>
              <span className="qz-feedback-icon">{currentCorrect ? "✅" : "❌"}</span>
              <div>
                <strong>{currentCorrect ? "Correct!" : `Incorrect — the right answer is: ${QS[cur].a}`}</strong>
                {QS[cur].explanation}
              </div>
            </div>
          )}

          <div className="qz-nav">
            <button className="qz-nbtn" disabled={cur === 0} onClick={() => setCur(cur - 1)}>
              ← Back
            </button>
            {isLast ? (
              <button
                className="qz-nbtn qz-nbtn-submit"
                disabled={!allDone}
                onClick={() => setSubmitted(true)}
              >
                Submit quiz ✓
              </button>
            ) : (
              <button
                className="qz-nbtn qz-nbtn-primary"
                disabled={answers[cur] === undefined}
                onClick={() => setCur(cur + 1)}
              >
                Next →
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Results */
        <div className="qz-result-wrap">
          <div className="qz-result-banner">
            <svg width="72" height="72" viewBox="0 0 72 72" className="qz-ring" aria-hidden="true">
              <circle cx="36" cy="36" r="28" fill={ringBg} stroke={ringColor} strokeWidth="1" />
              <text x="36" y="33" textAnchor="middle" fontSize="18" fontWeight="500" fill={ringColor} fontFamily="sans-serif">
                {score}/{QS.length}
              </text>
              <text x="36" y="47" textAnchor="middle" fontSize="11" fill={ringColor} fontFamily="sans-serif">
                {pctScore}%
              </text>
            </svg>
            <div className="qz-result-info">
              <h2 className="qz-result-title">
                {score === QS.length ? "Perfect score!" : score >= 2 ? "Nice work!" : "Keep practising"}
              </h2>
              <p className="qz-result-msg">
                {score === QS.length
                  ? "You nailed every question. Your pet is in safe paws."
                  : score >= 2
                  ? "You got most of it right — review the missed answer below."
                  : "Every question counts. Review the answers and try again."}
              </p>
              <div className="qz-stats">
                <div className="qz-stat">
                  <span className="qz-stat-n qz-stat-green">{score}</span>
                  <span className="qz-stat-l">Correct</span>
                </div>
                <div className="qz-stat">
                  <span className="qz-stat-n qz-stat-red">{QS.length - score}</span>
                  <span className="qz-stat-l">Incorrect</span>
                </div>
                <div className="qz-stat">
                  <span className="qz-stat-n">{pctScore}%</span>
                  <span className="qz-stat-l">Score</span>
                </div>
              </div>
            </div>
          </div>

          {/* Review list */}
          <div className="qz-review-list">
            {QS.map((q, i) => {
              const ok = answers[i] === q.a;
              return (
                <div key={i} className={`qz-rev-item ${ok ? "qz-rev-ok" : "qz-rev-bad"}`}>
                  <div className="qz-rev-q">
                    <span className={`qz-rev-badge ${ok ? "qz-badge-ok" : "qz-badge-bad"}`}>
                      {ok ? "Correct" : "Incorrect"}
                    </span>
                    {q.q}
                  </div>
                  {!ok && (
                    <p className="qz-rev-ans">
                      Correct answer: <strong>{q.a}</strong>
                    </p>
                  )}
                  {q.explanation && (
                    <p className="qz-rev-ans" style={{ marginTop: 4 }}>{q.explanation}</p>
                  )}
                </div>
              );
            })}
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