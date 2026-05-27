import { useEffect, useMemo, useState } from "react";
import "../../styles/admin.css";
import "../../styles/manageQuiz.css";

const API_URL = import.meta.env.VITE_API_URL;

function relativeTime(dateString) {
  if (!dateString) return "—";
  const diff = Math.floor((new Date() - new Date(dateString)) / 1000);
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
  if (diff < 172800) return "Yesterday";
  return `${Math.floor(diff / 86400)} days ago`;
}

function ManageQuiz() {
  const [activeTab, setActiveTab] = useState("quizzes");
  const [actionMenu, setActionMenu] = useState(null);
  const [modalType, setModalType] = useState(null);
  const [selectedQuizId, setSelectedQuizId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [guides, setGuides] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [quizResults, setQuizResults] = useState([]);

  const [quizForm, setQuizForm] = useState({ id: null, title: "", guideId: "", passingScore: 70, status: "draft" });
  const [questionForm, setQuestionForm] = useState({ id: null, quizId: "", questionText: "", optionA: "", optionB: "", optionC: "", optionD: "", correctAnswer: "" });

  const [searchKeyword, setSearchKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const token = localStorage.getItem("token");

  // ── Fetch all data ────────────────────────────────────────
  useEffect(() => {
    async function fetchAll() {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const [guidesRes, quizzesRes, resultsRes] = await Promise.all([
          fetch(`${API_URL}/api/admin/guides`, { headers }),
          fetch(`${API_URL}/api/admin/quizzes`, { headers }),
          fetch(`${API_URL}/api/admin/quiz-results`, { headers }),
        ]);
        const [g, qz, r] = await Promise.all([guidesRes.json(), quizzesRes.json(), resultsRes.json()]);
        setGuides((g.guides || []).map((gd) => ({ id: gd.guideID, title: gd.guideTitle, topicTitle: gd.topicTitle })));
        setQuizzes((qz.quizzes || []).map((q) => ({ id: q.quizID, title: q.quizTitle, guideId: q.guideID, guideTitle: q.guideTitle, passingScore: q.pass_mark, status: q.quizStatus, description: q.description || "" })));
        setQuizResults((r.results || []).map((res) => ({ id: res.resultID, userName: res.userName, quizId: res.quizID, quizTitle: res.quizTitle, score: res.score, total: res.total_questions, passed: res.passed, attemptedAt: res.attempted_at })));
      } catch (err) {
        setError("Failed to load data. " + err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, []);

  // ── Load questions when questions modal opens ─────────────
  async function loadQuestions(quizId) {
    try {
      const res = await fetch(`${API_URL}/api/admin/questions?quizID=${quizId}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      const parsed = (data.questions || []).map((q) => {
        const texts = q.answerTexts ? q.answerTexts.split("|||") : [];
        const corrects = q.answerCorrect ? q.answerCorrect.split(",") : [];
        const ids = q.answerIDs ? q.answerIDs.split(",") : [];
        const options = texts.map((t) => t);
        const correctAnswer = texts.find((t, i) => corrects[i] === "1") || "";
        return { id: q.questionID, quizId: q.quizID, questionText: q.text, options, correctAnswer, answerIds: ids };
      });
      setQuestions((prev) => {
        const others = prev.filter((q) => q.quizId !== quizId);
        return [...others, ...parsed];
      });
    } catch { /* silent */ }
  }

  // ── Helpers ───────────────────────────────────────────────
  const filteredQuizzes = useMemo(() => {
    return quizzes.filter((quiz) => {
      const keyword = searchKeyword.toLowerCase();
      const matchesSearch =
        quiz.title.toLowerCase().includes(keyword) ||
        quiz.guideTitle?.toLowerCase().includes(keyword);
      const matchesStatus = statusFilter === "All" || quiz.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [quizzes, searchKeyword, statusFilter]);

  function getQuizById(id) { return quizzes.find((q) => q.id === Number(id)); }
  function getQuestionCount(quizId) { return questions.filter((q) => q.quizId === quizId).length; }

  // ── Action menu ───────────────────────────────────────────
  function openActionMenu(event, type, id) {
    const rect = event.currentTarget.getBoundingClientRect();
    const menuWidth = 190; const gap = 10;
    const hasSpaceRight = window.innerWidth - rect.right > menuWidth + gap;
    const left = hasSpaceRight ? rect.right + gap : Math.max(12, rect.left - menuWidth - gap);
    const top = Math.min(rect.top, window.innerHeight - 250);
    setActionMenu({ type, id, left, top });
  }
  function closeActionMenu() { setActionMenu(null); }
  function closeModal() { setModalType(null); setSelectedQuizId(null); }

  // ── Quiz CRUD ─────────────────────────────────────────────
  function openAddQuizModal() {
    closeActionMenu();
    setQuizForm({ id: null, title: "", guideId: "", passingScore: 70, status: "draft" });
    setModalType("quiz");
  }
  function openEditQuizModal(quiz) {
    closeActionMenu();
    setQuizForm({ id: quiz.id, title: quiz.title, guideId: quiz.guideId, passingScore: quiz.passingScore, status: quiz.status });
    setModalType("quiz");
  }

  async function handleQuizSubmit(event) {
    event.preventDefault();
    if (!quizForm.title.trim()) { alert("Please enter quiz title."); return; }
    if (!quizForm.guideId) { alert("Please select a guide."); return; }
    if (quizForm.passingScore < 1 || quizForm.passingScore > 100) { alert("Passing score must be between 1 and 100."); return; }
    if (quizForm.status === "published" && quizForm.id && getQuestionCount(quizForm.id) === 0) {
      alert("A quiz must have at least one question before publishing."); return;
    }
    const body = { guideID: quizForm.guideId, quizTitle: quizForm.title, pass_mark: quizForm.passingScore, quizStatus: quizForm.status };
    try {
      if (quizForm.id) {
        const res = await fetch(`${API_URL}/api/admin/quizzes/${quizForm.id}`, { method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(body) });
        if (!res.ok) { const d = await res.json(); alert(d.message || "Failed to update quiz."); return; }
        setQuizzes((prev) => prev.map((q) => q.id === quizForm.id ? { ...q, title: quizForm.title, guideId: Number(quizForm.guideId), passingScore: Number(quizForm.passingScore), status: quizForm.status } : q));
      } else {
        const res = await fetch(`${API_URL}/api/admin/quizzes`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(body) });
        if (!res.ok) { const d = await res.json(); alert(d.message || "Failed to create quiz."); return; }
        const d = await res.json();
        const guide = guides.find((g) => g.id === Number(quizForm.guideId));
        setQuizzes((prev) => [...prev, { id: d.quizID, title: quizForm.title, guideId: Number(quizForm.guideId), guideTitle: guide?.title || "", passingScore: Number(quizForm.passingScore), status: quizForm.status }]);
      }
      closeModal();
    } catch { alert("Server error."); }
  }

  async function handleToggleQuizStatus(id) {
    const quiz = quizzes.find((q) => q.id === id);
    if (!quiz) return;
    const newStatus = quiz.status === "published" ? "draft" : "published";
    if (newStatus === "published" && getQuestionCount(id) === 0) { alert("A quiz must have at least one question before publishing."); return; }
    try {
      const res = await fetch(`${API_URL}/api/admin/quizzes/${id}`, { method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ guideID: quiz.guideId, quizTitle: quiz.title, pass_mark: quiz.passingScore, quizStatus: newStatus }) });
      if (!res.ok) { const d = await res.json(); alert(d.message || "Failed to update quiz."); return; }
      setQuizzes((prev) => prev.map((q) => q.id === id ? { ...q, status: newStatus } : q));
    } catch { alert("Server error."); }
  }

  async function handleDeleteQuiz(id) {
    if (!window.confirm("Permanently delete this quiz and all its questions?")) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/quizzes/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) { const d = await res.json(); alert(d.message || "Failed to delete quiz."); return; }
      setQuizzes((prev) => prev.filter((q) => q.id !== id));
      setQuestions((prev) => prev.filter((q) => q.quizId !== id));
    } catch { alert("Server error."); }
  }

  // ── Questions CRUD ────────────────────────────────────────
  function openQuestionsModal(quizId) {
    closeActionMenu();
    setSelectedQuizId(quizId);
    loadQuestions(quizId);
    resetQuestionForm(quizId);
    setModalType("questions");
  }

  function resetQuestionForm(quizId) {
    setQuestionForm({ id: null, quizId: quizId || selectedQuizId, questionText: "", optionA: "", optionB: "", optionC: "", optionD: "", correctAnswer: "" });
  }

  function editQuestion(question) {
    setQuestionForm({
      id: question.id, quizId: question.quizId, questionText: question.questionText,
      optionA: question.options[0] || "", optionB: question.options[1] || "",
      optionC: question.options[2] || "", optionD: question.options[3] || "",
      correctAnswer: question.correctAnswer,
    });
    setTimeout(() => { document.querySelector(".question-form")?.scrollIntoView({ behavior: "smooth", block: "start" }); }, 50);
  }

  async function handleQuestionSubmit(event) {
    event.preventDefault();
    if (!questionForm.questionText.trim()) { alert("Please enter the question."); return; }
    const options = [questionForm.optionA, questionForm.optionB, questionForm.optionC, questionForm.optionD].filter((o) => o.trim() !== "");
    if (options.length < 2) { alert("Please enter at least two answer options."); return; }
    if (!questionForm.correctAnswer) { alert("Please select the correct answer."); return; }

    const body = { quizID: selectedQuizId, text: questionForm.questionText, options, correctAnswer: questionForm.correctAnswer, order_num: getQuestionCount(selectedQuizId) + 1 };
    try {
      if (questionForm.id) {
        const res = await fetch(`${API_URL}/api/admin/questions/${questionForm.id}`, { method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(body) });
        if (!res.ok) { const d = await res.json(); alert(d.message || "Failed to update question."); return; }
        setQuestions((prev) => prev.map((q) => q.id === questionForm.id ? { ...q, questionText: questionForm.questionText, options, correctAnswer: questionForm.correctAnswer } : q));
      } else {
        const res = await fetch(`${API_URL}/api/admin/questions`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(body) });
        if (!res.ok) { const d = await res.json(); alert(d.message || "Failed to create question."); return; }
        const d = await res.json();
        setQuestions((prev) => [...prev, { id: d.questionID, quizId: selectedQuizId, questionText: questionForm.questionText, options, correctAnswer: questionForm.correctAnswer }]);
      }
      resetQuestionForm(selectedQuizId);
    } catch { alert("Server error."); }
  }

  async function handleDeleteQuestion(id) {
    if (!window.confirm("Delete this question?")) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/questions/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) { const d = await res.json(); alert(d.message || "Failed to delete question."); return; }
      setQuestions((prev) => prev.filter((q) => q.id !== id));
    } catch { alert("Server error."); }
  }

  // ── Action menu render ────────────────────────────────────
  function renderActionMenu() {
    if (!actionMenu || actionMenu.type !== "quiz") return null;
    const quiz = quizzes.find((q) => q.id === actionMenu.id);
    if (!quiz) return null;
    return (
      <>
        <div className="floating-menu-backdrop" onClick={closeActionMenu} />
        <div className="floating-action-menu" style={{ left: `${actionMenu.left}px`, top: `${actionMenu.top}px` }}>
          <button onClick={() => openEditQuizModal(quiz)}>Edit Quiz</button>
          <button onClick={() => openQuestionsModal(quiz.id)}>Manage Questions</button>
          <button onClick={() => { handleToggleQuizStatus(quiz.id); closeActionMenu(); }}>
            {quiz.status === "published" ? "Move to Draft" : "Publish"}
          </button>
          <button className="danger-text" onClick={() => { handleDeleteQuiz(quiz.id); closeActionMenu(); }}>Delete</button>
        </div>
      </>
    );
  }

  // ── Quiz modal ────────────────────────────────────────────
  function renderQuizModal() {
    if (modalType !== "quiz") return null;
    return (
      <div className="modal-backdrop" onClick={closeModal}>
        <section className="admin-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <div><p className="page-subtitle">Quiz</p><h2>{quizForm.id ? "Edit Quiz" : "Add Quiz"}</h2></div>
            <button className="modal-close-btn" onClick={closeModal}>×</button>
          </div>
          <form onSubmit={handleQuizSubmit} className="admin-form">
            <label>
              Quiz Title
              <input type="text" placeholder="Example: Dog Choking Quiz" value={quizForm.title} onChange={(e) => setQuizForm({ ...quizForm, title: e.target.value })} />
            </label>
            <label>
              Related Guide
              <select value={quizForm.guideId} onChange={(e) => setQuizForm({ ...quizForm, guideId: e.target.value })}>
                <option value="">Select guide</option>
                {guides.map((g) => (<option key={g.id} value={g.id}>{g.title}</option>))}
              </select>
            </label>
            <label>
              Passing Score (%)
              <input type="number" min="1" max="100" value={quizForm.passingScore} onChange={(e) => setQuizForm({ ...quizForm, passingScore: e.target.value })} />
            </label>
            <label>
              Status
              <select value={quizForm.status} onChange={(e) => setQuizForm({ ...quizForm, status: e.target.value })}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </label>
            <div className="form-actions">
              <button type="submit" className="primary-btn">{quizForm.id ? "Save Changes" : "+ Add Quiz"}</button>
              <button type="button" className="secondary-btn" onClick={closeModal}>Cancel</button>
            </div>
          </form>
        </section>
      </div>
    );
  }

  // ── Questions modal ───────────────────────────────────────
  function renderQuestionsModal() {
    if (modalType !== "questions") return null;
    const selectedQuiz = getQuizById(selectedQuizId);
    const selectedQuestions = questions.filter((q) => q.quizId === selectedQuizId);
    const answerOptions = [questionForm.optionA, questionForm.optionB, questionForm.optionC, questionForm.optionD].filter((o) => o.trim() !== "");

    return (
      <div className="modal-backdrop" onClick={closeModal}>
        <section className="admin-modal large-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <div><p className="page-subtitle">Quiz Questions</p><h2>{selectedQuiz?.title}</h2></div>
            <button className="modal-close-btn" onClick={closeModal}>×</button>
          </div>

          <div className="question-list">
            {selectedQuestions.length > 0 ? selectedQuestions.map((question) => (
              <div key={question.id} className="question-card">
                <div>
                  <strong>{question.questionText}</strong>
                  <ul>
                    {question.options.map((option) => (
                      <li key={option} className={option === question.correctAnswer ? "correct-option" : ""}>{option}</li>
                    ))}
                  </ul>
                </div>
                <div className="question-actions">
                  <button type="button" className="secondary-btn" onClick={() => editQuestion(question)}>Edit</button>
                  <button type="button" className="secondary-btn danger-outline" onClick={() => handleDeleteQuestion(question.id)}>Delete</button>
                </div>
              </div>
            )) : (
              <p className="empty-table-text">No questions added yet.</p>
            )}
          </div>

          <form onSubmit={handleQuestionSubmit} className="admin-form question-form">
            <h3>{questionForm.id ? "Edit Question" : "Add Question"}</h3>
            <label>
              Question
              <textarea rows="3" placeholder="Enter quiz question" value={questionForm.questionText} onChange={(e) => setQuestionForm({ ...questionForm, questionText: e.target.value })} />
            </label>
            <div className="quiz-option-grid">
              <label>Option A<input type="text" value={questionForm.optionA} onChange={(e) => setQuestionForm({ ...questionForm, optionA: e.target.value })} /></label>
              <label>Option B<input type="text" value={questionForm.optionB} onChange={(e) => setQuestionForm({ ...questionForm, optionB: e.target.value })} /></label>
              <label>Option C<input type="text" value={questionForm.optionC} onChange={(e) => setQuestionForm({ ...questionForm, optionC: e.target.value })} /></label>
              <label>Option D<input type="text" value={questionForm.optionD} onChange={(e) => setQuestionForm({ ...questionForm, optionD: e.target.value })} /></label>
            </div>
            <label>
              Correct Answer
              <select value={questionForm.correctAnswer} onChange={(e) => setQuestionForm({ ...questionForm, correctAnswer: e.target.value })}>
                <option value="">Select correct answer</option>
                {answerOptions.map((option) => (<option key={option} value={option}>{option}</option>))}
              </select>
            </label>
            <div className="form-actions">
              <button type="submit" className="primary-btn">{questionForm.id ? "Save Question Changes" : "+ Add Question"}</button>
              {questionForm.id && (<button type="button" className="secondary-btn" onClick={() => resetQuestionForm(selectedQuizId)}>Cancel Edit</button>)}
            </div>
          </form>
        </section>
      </div>
    );
  }

  if (loading) return <div className="admin-page"><p>Loading…</p></div>;
  if (error) return <div className="admin-page"><p style={{ color: "crimson" }}>{error}</p></div>;

  return (
    <div className="admin-page">
      {renderActionMenu()}
      {renderQuizModal()}
      {renderQuestionsModal()}

      <div className="page-title-row">
        <div className="page-title-area">
          <p className="page-subtitle">Admin Management</p>
          <h1>Manage Quizzes</h1>
        </div>
      </div>

      <div className="admin-tabs">
        <button className={activeTab === "quizzes" ? "active" : ""} onClick={() => { setActiveTab("quizzes"); closeActionMenu(); }}>Quiz List</button>
        <button className={activeTab === "results" ? "active" : ""} onClick={() => { setActiveTab("results"); closeActionMenu(); }}>Quiz Results</button>
      </div>

      {activeTab === "quizzes" && (
        <section className="admin-table-card">
          <div className="table-header-row">
            <div>
              <h2>Quiz List</h2>
              <p className="form-note">Quizzes are linked to first-aid guides. A quiz needs at least one question before publishing.</p>
            </div>
            <button className="primary-btn table-add-btn" onClick={openAddQuizModal}>+ Add Quiz</button>
          </div>
          <div className="filter-row quiz-filter-row">
            <input type="text" placeholder="Search by quiz title or guide..." value={searchKeyword} onChange={(e) => setSearchKeyword(e.target.value)} />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="All">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
          </div>
          <p className="table-scroll-note">Scroll sideways to view more columns on smaller screens.</p>
          <div className="table-responsive">
            <table className="admin-table quiz-table">
              <thead>
                <tr><th>Quiz Title</th><th>Guide</th><th>Questions</th><th>Passing Score</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {filteredQuizzes.length > 0 ? filteredQuizzes.map((quiz) => (
                  <tr key={quiz.id}>
                    <td><strong className="cell-title">{quiz.title}</strong></td>
                    <td><span className="long-table-text">{quiz.guideTitle || "—"}</span></td>
                    <td>{getQuestionCount(quiz.id)}</td>
                    <td>{quiz.passingScore}%</td>
                    <td><span className={quiz.status === "published" ? "status-badge" : "status-badge draft"}>{quiz.status}</span></td>
                    <td><button className="three-dot-btn" onClick={(e) => openActionMenu(e, "quiz", quiz.id)}>⋯</button></td>
                  </tr>
                )) : (
                  <tr><td colSpan="6" className="empty-table-text">No quizzes found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {activeTab === "results" && (
        <section className="admin-table-card">
          <div className="table-header-row">
            <div><h2>Quiz Results</h2><p className="form-note">Review users' quiz attempts and learning progress.</p></div>
          </div>
          <p className="table-scroll-note">Scroll sideways to view more columns on smaller screens.</p>
          <div className="table-responsive">
            <table className="admin-table quiz-result-table">
              <thead>
                <tr><th>User</th><th>Quiz</th><th>Score</th><th>Result</th><th>Attempted At</th></tr>
              </thead>
              <tbody>
                {quizResults.length > 0 ? quizResults.map((result) => (
                  <tr key={result.id}>
                    <td>{result.userName}</td>
                    <td><span className="long-table-text">{result.quizTitle}</span></td>
                    <td>{result.score}/{result.total}</td>
                    <td><span className={result.passed ? "status-badge" : "status-badge suspended"}>{result.passed ? "Passed" : "Failed"}</span></td>
                    <td>{relativeTime(result.attemptedAt)}</td>
                  </tr>
                )) : (
                  <tr><td colSpan="5" className="empty-table-text">No quiz results yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

export default ManageQuiz;