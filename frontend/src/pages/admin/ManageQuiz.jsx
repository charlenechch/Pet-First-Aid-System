import { useMemo, useState } from "react";
import "../../styles/admin.css";
import "../../styles/manageQuiz.css";

function ManageQuiz() {
  const [activeTab, setActiveTab] = useState("quizzes");
  const [actionMenu, setActionMenu] = useState(null);
  const [modalType, setModalType] = useState(null);
  const [selectedQuizId, setSelectedQuizId] = useState(null);

  const pets = [
    { id: 1, name: "Dog", emoji: "🐶", status: "Active" },
    { id: 2, name: "Cat", emoji: "🐱", status: "Active" },
    { id: 3, name: "Rabbit", emoji: "🐰", status: "Active" },
    { id: 4, name: "Bird", emoji: "🐦", status: "Active" },
  ];

  const emergencyTopics = [
    { id: 101, title: "Choking", petIds: [1, 2], status: "Published" },
    { id: 102, title: "Heatstroke", petIds: [1, 3], status: "Published" },
    { id: 103, title: "Poisoning", petIds: [1, 2], status: "Published" },
    { id: 105, title: "Broken Wing", petIds: [4], status: "Published" },
  ];

  const guides = [
    {
      id: 1,
      topicId: 101,
      petIds: [1, 2],
      title: "Choking & Airway Blockage",
      status: "Published",
    },
    {
      id: 2,
      topicId: 102,
      petIds: [1],
      title: "Dog Heatstroke & Overheating",
      status: "Published",
    },
    {
      id: 3,
      topicId: 102,
      petIds: [3],
      title: "Rabbit Heatstroke Care",
      status: "Draft",
    },
    {
      id: 4,
      topicId: 105,
      petIds: [4],
      title: "Bird Wound & Bleeding Care",
      status: "Published",
    },
  ];

  const [quizzes, setQuizzes] = useState([
    {
      id: 1,
      title: "Dog & Cat Choking Quiz",
      guideId: 1,
      passingScore: 70,
      status: "Published",
    },
    {
      id: 2,
      title: "Dog Heatstroke Quiz",
      guideId: 2,
      passingScore: 80,
      status: "Published",
    },
    {
      id: 3,
      title: "Bird Wound Care Quiz",
      guideId: 4,
      passingScore: 70,
      status: "Draft",
    },
  ]);

  const [questions, setQuestions] = useState([
    {
      id: 1,
      quizId: 1,
      questionText: "What should you do first when a pet is choking?",
      options: [
        "Stay calm and keep the pet still",
        "Give food immediately",
        "Force the pet to drink water",
        "Ignore it",
      ],
      correctAnswer: "Stay calm and keep the pet still",
      status: "Published",
    },
    {
      id: 2,
      quizId: 1,
      questionText: "When should you contact a veterinarian?",
      options: [
        "If the pet cannot breathe",
        "Only after one week",
        "Never",
        "Only if the pet eats",
      ],
      correctAnswer: "If the pet cannot breathe",
      status: "Published",
    },
    {
      id: 3,
      quizId: 2,
      questionText: "Where should you move an overheated dog?",
      options: [
        "A cool shaded area",
        "Direct sunlight",
        "A hot room",
        "Inside a closed car",
      ],
      correctAnswer: "A cool shaded area",
      status: "Published",
    },
  ]);

  const [quizResults] = useState([
    {
      id: 1,
      userName: "Jane Smith",
      quizId: 1,
      score: 90,
      result: "Passed",
      attemptedAt: "Today",
    },
    {
      id: 2,
      userName: "Mark Lim",
      quizId: 2,
      score: 65,
      result: "Failed",
      attemptedAt: "Yesterday",
    },
    {
      id: 3,
      userName: "Aisha Rahman",
      quizId: 1,
      score: 80,
      result: "Passed",
      attemptedAt: "2 days ago",
    },
  ]);

  const [quizForm, setQuizForm] = useState({
    id: null,
    title: "",
    guideId: "",
    passingScore: 70,
    status: "Draft",
  });

  const [questionForm, setQuestionForm] = useState({
    id: null,
    quizId: "",
    questionText: "",
    optionA: "",
    optionB: "",
    optionC: "",
    optionD: "",
    correctAnswer: "",
    status: "Published",
  });

  const [searchKeyword, setSearchKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const filteredQuizzes = useMemo(() => {
    return quizzes.filter((quiz) => {
      const guide = getGuideById(quiz.guideId);
      const topic = guide ? getTopicById(guide.topicId) : null;
      const petNames = guide ? getPetNamesByGuide(guide) : "";

      const keyword = searchKeyword.toLowerCase();

      const matchesSearch =
        quiz.title.toLowerCase().includes(keyword) ||
        guide?.title.toLowerCase().includes(keyword) ||
        topic?.title.toLowerCase().includes(keyword) ||
        petNames.toLowerCase().includes(keyword);

      const matchesStatus =
        statusFilter === "All" || quiz.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [quizzes, searchKeyword, statusFilter]);

  function getGuideById(guideId) {
    return guides.find((guide) => guide.id === Number(guideId));
  }

  function getTopicById(topicId) {
    return emergencyTopics.find((topic) => topic.id === Number(topicId));
  }

  function getPetNamesByGuide(guide) {
    const linkedPets = pets.filter((pet) => guide.petIds.includes(pet.id));

    if (linkedPets.length === 0) return "No linked pet";

    return linkedPets.map((pet) => `${pet.emoji} ${pet.name}`).join(", ");
  }

  function getQuestionCount(quizId) {
    return questions.filter(
      (question) =>
        question.quizId === Number(quizId) && question.status !== "Archived"
    ).length;
  }

  function getQuizById(quizId) {
    return quizzes.find((quiz) => quiz.id === Number(quizId));
  }

  function openActionMenu(event, type, id) {
    const rect = event.currentTarget.getBoundingClientRect();
    const menuWidth = 190;
    const gap = 10;

    const hasSpaceRight = window.innerWidth - rect.right > menuWidth + gap;
    const left = hasSpaceRight
      ? rect.right + gap
      : Math.max(12, rect.left - menuWidth - gap);

    const top = Math.min(rect.top, window.innerHeight - 250);

    setActionMenu({ type, id, left, top });
  }

  function closeActionMenu() {
    setActionMenu(null);
  }

  function closeModal() {
    setModalType(null);
    setSelectedQuizId(null);
  }

  function openAddQuizModal() {
    closeActionMenu();

    setQuizForm({
      id: null,
      title: "",
      guideId: "",
      passingScore: 70,
      status: "Draft",
    });

    setModalType("quiz");
  }

  function openEditQuizModal(quiz) {
    closeActionMenu();

    setQuizForm({
      id: quiz.id,
      title: quiz.title,
      guideId: quiz.guideId,
      passingScore: quiz.passingScore,
      status: quiz.status,
    });

    setModalType("quiz");
  }

  function openQuestionsModal(quizId) {
    closeActionMenu();

    setSelectedQuizId(quizId);

    setQuestionForm({
      id: null,
      quizId,
      questionText: "",
      optionA: "",
      optionB: "",
      optionC: "",
      optionD: "",
      correctAnswer: "",
      status: "Published",
    });

    setModalType("questions");
  }

  function handleQuizSubmit(event) {
    event.preventDefault();

    if (!quizForm.title.trim()) {
      alert("Please enter quiz title.");
      return;
    }

    if (!quizForm.guideId) {
      alert("Please select a guide.");
      return;
    }

    if (quizForm.passingScore < 1 || quizForm.passingScore > 100) {
      alert("Passing score must be between 1 and 100.");
      return;
    }

    if (quizForm.status === "Published" && quizForm.id) {
      if (getQuestionCount(quizForm.id) === 0) {
        alert("A quiz must have at least one question before publishing.");
        return;
      }
    }

    if (quizForm.status === "Published" && !quizForm.id) {
      alert("New quizzes should be saved as Draft first. Add questions before publishing.");
      return;
    }

    if (quizForm.id) {
      setQuizzes((prevQuizzes) =>
        prevQuizzes.map((quiz) =>
          quiz.id === quizForm.id
            ? {
                ...quiz,
                title: quizForm.title,
                guideId: Number(quizForm.guideId),
                passingScore: Number(quizForm.passingScore),
                status: quizForm.status,
              }
            : quiz
        )
      );

      closeModal();
      return;
    }

    const newQuiz = {
      id: Date.now(),
      title: quizForm.title,
      guideId: Number(quizForm.guideId),
      passingScore: Number(quizForm.passingScore),
      status: quizForm.status,
    };

    setQuizzes((prevQuizzes) => [...prevQuizzes, newQuiz]);
    closeModal();
  }

  function handleQuestionSubmit(event) {
    event.preventDefault();

    if (!questionForm.questionText.trim()) {
      alert("Please enter the question.");
      return;
    }

    const options = [
      questionForm.optionA,
      questionForm.optionB,
      questionForm.optionC,
      questionForm.optionD,
    ].filter((option) => option.trim() !== "");

    if (options.length < 2) {
      alert("Please enter at least two answer options.");
      return;
    }

    if (!questionForm.correctAnswer) {
      alert("Please select the correct answer.");
      return;
    }

    if (questionForm.id) {
      setQuestions((prevQuestions) =>
        prevQuestions.map((question) =>
          question.id === questionForm.id
            ? {
                ...question,
                questionText: questionForm.questionText,
                options,
                correctAnswer: questionForm.correctAnswer,
                status: questionForm.status,
              }
            : question
        )
      );

      resetQuestionForm();
      return;
    }

    const newQuestion = {
      id: Date.now(),
      quizId: Number(questionForm.quizId),
      questionText: questionForm.questionText,
      options,
      correctAnswer: questionForm.correctAnswer,
      status: questionForm.status,
    };

    setQuestions((prevQuestions) => [...prevQuestions, newQuestion]);
    resetQuestionForm();
  }

  function resetQuestionForm() {
    setQuestionForm({
      id: null,
      quizId: selectedQuizId,
      questionText: "",
      optionA: "",
      optionB: "",
      optionC: "",
      optionD: "",
      correctAnswer: "",
      status: "Published",
    });
  }

  function editQuestion(question) {
    setQuestionForm({
      id: question.id,
      quizId: question.quizId,
      questionText: question.questionText,
      optionA: question.options[0] || "",
      optionB: question.options[1] || "",
      optionC: question.options[2] || "",
      optionD: question.options[3] || "",
      correctAnswer: question.correctAnswer,
      status: question.status,
    });

    setTimeout(() => {
      document
        .querySelector(".question-form")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  }

  function updateQuizStatus(id, status) {
    if (status === "Published" && getQuestionCount(id) === 0) {
      alert("A quiz must have at least one question before publishing.");
      return;
    }

    setQuizzes((prevQuizzes) =>
      prevQuizzes.map((quiz) =>
        quiz.id === id ? { ...quiz, status } : quiz
      )
    );
  }

  function updateQuestionStatus(id, status) {
    setQuestions((prevQuestions) =>
      prevQuestions.map((question) =>
        question.id === id ? { ...question, status } : question
      )
    );
  }

  function renderActionMenu() {
    if (!actionMenu) return null;

    if (actionMenu.type === "quiz") {
      const quiz = quizzes.find((item) => item.id === actionMenu.id);
      if (!quiz) return null;

      return (
        <>
          <div className="floating-menu-backdrop" onClick={closeActionMenu} />

          <div
            className="floating-action-menu"
            style={{
              left: `${actionMenu.left}px`,
              top: `${actionMenu.top}px`,
            }}
          >
            <button onClick={() => openEditQuizModal(quiz)}>Edit Quiz</button>

            <button onClick={() => openQuestionsModal(quiz.id)}>
              Manage Questions
            </button>

            {quiz.status === "Published" && (
              <button
                onClick={() => {
                  updateQuizStatus(quiz.id, "Draft");
                  closeActionMenu();
                }}
              >
                Move to Draft
              </button>
            )}

            {(quiz.status === "Draft" || quiz.status === "Archived") && (
              <button
                onClick={() => {
                  updateQuizStatus(quiz.id, "Published");
                  closeActionMenu();
                }}
              >
                Publish
              </button>
            )}

            {quiz.status !== "Archived" && (
              <button
                className="danger-text"
                onClick={() => {
                  updateQuizStatus(quiz.id, "Archived");
                  closeActionMenu();
                }}
              >
                Archive
              </button>
            )}
          </div>
        </>
      );
    }

    return null;
  }

  function renderQuizModal() {
    if (modalType !== "quiz") return null;

    return (
      <div className="modal-backdrop" onClick={closeModal}>
        <section
          className="admin-modal"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="modal-header">
            <div>
              <p className="page-subtitle">Quiz</p>
              <h2>{quizForm.id ? "Edit Quiz" : "Add Quiz"}</h2>
            </div>

            <button className="modal-close-btn" onClick={closeModal}>
              ×
            </button>
          </div>

          <form onSubmit={handleQuizSubmit} className="admin-form">
            <label>
              Quiz Title
              <input
                type="text"
                placeholder="Example: Dog Choking Quiz"
                value={quizForm.title}
                onChange={(event) =>
                  setQuizForm({ ...quizForm, title: event.target.value })
                }
              />
            </label>

            <label>
              Related Guide
              <select
                value={quizForm.guideId}
                onChange={(event) =>
                  setQuizForm({ ...quizForm, guideId: event.target.value })
                }
              >
                <option value="">Select guide</option>
                {guides.map((guide) => (
                  <option key={guide.id} value={guide.id}>
                    {guide.title} — {getPetNamesByGuide(guide)}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Passing Score (%)
              <input
                type="number"
                min="1"
                max="100"
                value={quizForm.passingScore}
                onChange={(event) =>
                  setQuizForm({
                    ...quizForm,
                    passingScore: event.target.value,
                  })
                }
              />
            </label>

            <label>
              Status
              <select
                value={quizForm.status}
                onChange={(event) =>
                  setQuizForm({ ...quizForm, status: event.target.value })
                }
              >
                <option value="Draft">Draft</option>
                <option value="Published">Published</option>
                <option value="Archived">Archived</option>
              </select>
            </label>

            <div className="form-actions">
              <button type="submit" className="primary-btn">
                {quizForm.id ? "Save Changes" : "+ Add Quiz"}
              </button>

              <button type="button" className="secondary-btn" onClick={closeModal}>
                Cancel
              </button>
            </div>
          </form>
        </section>
      </div>
    );
  }

  function renderQuestionsModal() {
    if (modalType !== "questions") return null;

    const selectedQuiz = getQuizById(selectedQuizId);

    const selectedQuestions = questions.filter(
      (question) => question.quizId === selectedQuizId
    );

    const answerOptions = [
      questionForm.optionA,
      questionForm.optionB,
      questionForm.optionC,
      questionForm.optionD,
    ].filter((option) => option.trim() !== "");

    return (
      <div className="modal-backdrop" onClick={closeModal}>
        <section
          className="admin-modal large-modal"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="modal-header">
            <div>
              <p className="page-subtitle">Quiz Questions</p>
              <h2>{selectedQuiz?.title}</h2>
            </div>

            <button className="modal-close-btn" onClick={closeModal}>
              ×
            </button>
          </div>

          <div className="question-list">
            {selectedQuestions.length > 0 ? (
              selectedQuestions.map((question) => (
                <div
                  key={question.id}
                  className={`question-card ${
                    question.status === "Archived" ? "archived-question" : ""
                  }`}
                >
                  <div>
                    <strong>{question.questionText}</strong>

                    <ul>
                      {question.options.map((option) => (
                        <li
                          key={option}
                          className={
                            option === question.correctAnswer
                              ? "correct-option"
                              : ""
                          }
                        >
                          {option}
                        </li>
                      ))}
                    </ul>

                    <span
                      className={
                        question.status === "Published"
                          ? "status-badge"
                          : question.status === "Draft"
                          ? "status-badge draft"
                          : "status-badge archived"
                      }
                    >
                      {question.status}
                    </span>
                  </div>

                  <div className="question-actions">
                    <button
                      type="button"
                      className="secondary-btn"
                      onClick={() => editQuestion(question)}
                    >
                      Edit
                    </button>

                    {question.status === "Archived" ? (
                      <button
                        type="button"
                        className="secondary-btn"
                        onClick={() =>
                          updateQuestionStatus(question.id, "Published")
                        }
                      >
                        Publish
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="secondary-btn danger-outline"
                        onClick={() =>
                          updateQuestionStatus(question.id, "Archived")
                        }
                      >
                        Archive
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="empty-table-text">No questions added yet.</p>
            )}
          </div>

          <form
            onSubmit={handleQuestionSubmit}
            className="admin-form question-form"
          >
            <h3>{questionForm.id ? "Edit Question" : "Add Question"}</h3>

            <label>
              Question
              <textarea
                rows="3"
                placeholder="Enter quiz question"
                value={questionForm.questionText}
                onChange={(event) =>
                  setQuestionForm({
                    ...questionForm,
                    questionText: event.target.value,
                  })
                }
              />
            </label>

            <div className="quiz-option-grid">
              <label>
                Option A
                <input
                  type="text"
                  value={questionForm.optionA}
                  onChange={(event) =>
                    setQuestionForm({
                      ...questionForm,
                      optionA: event.target.value,
                    })
                  }
                />
              </label>

              <label>
                Option B
                <input
                  type="text"
                  value={questionForm.optionB}
                  onChange={(event) =>
                    setQuestionForm({
                      ...questionForm,
                      optionB: event.target.value,
                    })
                  }
                />
              </label>

              <label>
                Option C
                <input
                  type="text"
                  value={questionForm.optionC}
                  onChange={(event) =>
                    setQuestionForm({
                      ...questionForm,
                      optionC: event.target.value,
                    })
                  }
                />
              </label>

              <label>
                Option D
                <input
                  type="text"
                  value={questionForm.optionD}
                  onChange={(event) =>
                    setQuestionForm({
                      ...questionForm,
                      optionD: event.target.value,
                    })
                  }
                />
              </label>
            </div>

            <label>
              Correct Answer
              <select
                value={questionForm.correctAnswer}
                onChange={(event) =>
                  setQuestionForm({
                    ...questionForm,
                    correctAnswer: event.target.value,
                  })
                }
              >
                <option value="">Select correct answer</option>
                {answerOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Status
              <select
                value={questionForm.status}
                onChange={(event) =>
                  setQuestionForm({
                    ...questionForm,
                    status: event.target.value,
                  })
                }
              >
                <option value="Draft">Draft</option>
                <option value="Published">Published</option>
                <option value="Archived">Archived</option>
              </select>
            </label>

            <div className="form-actions">
              <button type="submit" className="primary-btn">
                {questionForm.id ? "Save Question Changes" : "+ Add Question"}
              </button>

              {questionForm.id && (
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={resetQuestionForm}
                >
                  Cancel Edit
                </button>
              )}
            </div>
          </form>
        </section>
      </div>
    );
  }

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
        <button
          className={activeTab === "quizzes" ? "active" : ""}
          onClick={() => {
            setActiveTab("quizzes");
            closeActionMenu();
          }}
        >
          Quiz List
        </button>

        <button
          className={activeTab === "results" ? "active" : ""}
          onClick={() => {
            setActiveTab("results");
            closeActionMenu();
          }}
        >
          Quiz Results
        </button>
      </div>

      {activeTab === "quizzes" && (
        <section className="admin-table-card">
          <div className="table-header-row">
            <div>
              <h2>Quiz List</h2>
              <p className="form-note">
                Quizzes are linked to pet-specific guides. A quiz should have at
                least one question before it is published.
              </p>
            </div>

            <button className="primary-btn table-add-btn" onClick={openAddQuizModal}>
              + Add Quiz
            </button>
          </div>

          <div className="filter-row quiz-filter-row">
            <input
              type="text"
              placeholder="Search by quiz, guide, pet type, or topic..."
              value={searchKeyword}
              onChange={(event) => setSearchKeyword(event.target.value)}
            />

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="All">All Status</option>
              <option value="Published">Published</option>
              <option value="Draft">Draft</option>
              <option value="Archived">Archived</option>
            </select>
          </div>

          <p className="table-scroll-note">
            Scroll sideways to view more columns on smaller screens.
          </p>

          <div className="table-responsive">
            <table className="admin-table quiz-table">
              <thead>
                <tr>
                  <th>Quiz Title</th>
                  <th>Guide</th>
                  <th>Pet Type</th>
                  <th>Questions</th>
                  <th>Passing Score</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredQuizzes.length > 0 ? (
                  filteredQuizzes.map((quiz) => {
                    const guide = getGuideById(quiz.guideId);

                    return (
                      <tr key={quiz.id}>
                        <td>
                          <strong className="cell-title">{quiz.title}</strong>
                          <p className="table-small-text">
                            Topic: {getTopicById(guide?.topicId)?.title || "N/A"}
                          </p>
                        </td>

                        <td>
                          <span className="long-table-text">
                            {guide?.title || "Unknown guide"}
                          </span>
                        </td>

                        <td>
                          <span className="long-table-text">
                            {guide ? getPetNamesByGuide(guide) : "N/A"}
                          </span>
                        </td>

                        <td>{getQuestionCount(quiz.id)}</td>

                        <td>{quiz.passingScore}%</td>

                        <td>
                          <span
                            className={
                              quiz.status === "Published"
                                ? "status-badge"
                                : quiz.status === "Draft"
                                ? "status-badge draft"
                                : "status-badge archived"
                            }
                          >
                            {quiz.status}
                          </span>
                        </td>

                        <td>
                          <button
                            className="three-dot-btn"
                            onClick={(event) =>
                              openActionMenu(event, "quiz", quiz.id)
                            }
                          >
                            ⋯
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="7" className="empty-table-text">
                      No quizzes found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {activeTab === "results" && (
        <section className="admin-table-card">
          <div className="table-header-row">
            <div>
              <h2>Quiz Results</h2>
              <p className="form-note">
                Review users’ quiz attempts and learning progress.
              </p>
            </div>
          </div>

          <p className="table-scroll-note">
            Scroll sideways to view more columns on smaller screens.
          </p>

          <div className="table-responsive">
            <table className="admin-table quiz-result-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Quiz</th>
                  <th>Score</th>
                  <th>Result</th>
                  <th>Attempted At</th>
                </tr>
              </thead>

              <tbody>
                {quizResults.map((result) => (
                  <tr key={result.id}>
                    <td>{result.userName}</td>

                    <td>
                      <span className="long-table-text">
                        {getQuizById(result.quizId)?.title || "Unknown quiz"}
                      </span>
                    </td>

                    <td>{result.score}%</td>

                    <td>
                      <span
                        className={
                          result.result === "Passed"
                            ? "status-badge"
                            : "status-badge suspended"
                        }
                      >
                        {result.result}
                      </span>
                    </td>

                    <td>{result.attemptedAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

export default ManageQuiz;