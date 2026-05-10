import { useMemo, useState } from "react";
import "../../styles/admin.css";
import "../../styles/managePetEmergency.css";

function ManagePetEmergency() {
  const [activeTab, setActiveTab] = useState("pets");
  const [actionMenu, setActionMenu] = useState(null);
  const [modalType, setModalType] = useState(null);

  const [pets, setPets] = useState([
    {
      id: 1,
      name: "Dog",
      emoji: "🐶",
      description: "Emergency topics related to dogs.",
      status: "Active",
    },
    {
      id: 2,
      name: "Cat",
      emoji: "🐱",
      description: "Emergency topics related to cats.",
      status: "Active",
    },
    {
      id: 3,
      name: "Rabbit",
      emoji: "🐰",
      description: "Emergency topics related to rabbits.",
      status: "Active",
    },
    {
      id: 4,
      name: "Bird",
      emoji: "🐦",
      description: "Emergency topics related to birds.",
      status: "Active",
    },
    {
      id: 5,
      name: "Others",
      emoji: "🐾",
      description: "General emergency topics for other pets.",
      status: "Active",
    },
  ]);

  const [topics, setTopics] = useState([
    {
      id: 101,
      petIds: [1, 2],
      title: "Choking",
      severity: "High",
      keywords: "choking, breathing, airway",
      status: "Published",
    },
    {
      id: 102,
      petIds: [1],
      title: "Heatstroke",
      severity: "High",
      keywords: "heat, fever, dehydration",
      status: "Published",
    },
    {
      id: 103,
      petIds: [2],
      title: "Poisoning",
      severity: "High",
      keywords: "poison, toxic, vomiting",
      status: "Published",
    },
    {
      id: 104,
      petIds: [3],
      title: "Loss of Appetite",
      severity: "Medium",
      keywords: "not eating, weak, appetite",
      status: "Draft",
    },
    {
      id: 105,
      petIds: [4],
      title: "Broken Wing",
      severity: "High",
      keywords: "wing, injury, bleeding",
      status: "Published",
    },
  ]);

  const [petForm, setPetForm] = useState({
    id: null,
    name: "",
    emoji: "",
    description: "",
  });

  const [topicForm, setTopicForm] = useState({
    id: null,
    petIds: [],
    title: "",
    severity: "Low",
    keywords: "",
    status: "Draft",
  });

  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedPetFilter, setSelectedPetFilter] = useState("All");

  const availablePetsForNewTopic = pets.filter((pet) => pet.status === "Active");

  const selectablePetsForTopic = pets.filter(
    (pet) => pet.status === "Active" || topicForm.petIds.includes(pet.id)
  );

  const filteredTopics = useMemo(() => {
    return topics.filter((topic) => {
      const topicPetIds = topic.petIds || [];
      const linkedPets = pets.filter((pet) => topicPetIds.includes(pet.id));
      const keyword = searchKeyword.toLowerCase();

      const matchesSearch =
        topic.title.toLowerCase().includes(keyword) ||
        topic.keywords.toLowerCase().includes(keyword) ||
        linkedPets.some((pet) => pet.name.toLowerCase().includes(keyword));

      const matchesPet =
        selectedPetFilter === "All" ||
        topicPetIds.includes(Number(selectedPetFilter));

      return matchesSearch && matchesPet;
    });
  }, [topics, pets, searchKeyword, selectedPetFilter]);

  function openActionMenu(event, type, id) {
    const rect = event.currentTarget.getBoundingClientRect();
    const menuWidth = 180;
    const gap = 10;

    const hasSpaceRight = window.innerWidth - rect.right > menuWidth + gap;
    const left = hasSpaceRight
      ? rect.right + gap
      : Math.max(12, rect.left - menuWidth - gap);

    const top = Math.min(rect.top, window.innerHeight - 220);

    setActionMenu({
      type,
      id,
      left,
      top,
    });
  }

  function closeActionMenu() {
    setActionMenu(null);
  }

  function openAddPetModal() {
    closeActionMenu();
    setPetForm({
      id: null,
      name: "",
      emoji: "",
      description: "",
    });
    setModalType("pet");
  }

  function openEditPetModal(pet) {
    closeActionMenu();

    if (pet.status === "Active") {
      alert("Please disable this pet type before editing.");
      return;
    }

    setPetForm({
      id: pet.id,
      name: pet.name,
      emoji: pet.emoji,
      description: pet.description,
    });

    setModalType("pet");
  }

  function openAddTopicModal() {
    closeActionMenu();
    setTopicForm({
      id: null,
      petIds: [],
      title: "",
      severity: "Low",
      keywords: "",
      status: "Draft",
    });
    setModalType("topic");
  }

  function openEditTopicModal(topic) {
    closeActionMenu();

    setTopicForm({
      id: topic.id,
      petIds: topic.petIds || [],
      title: topic.title,
      severity: topic.severity,
      keywords: topic.keywords,
      status: topic.status,
    });

    setActiveTab("topics");
    setModalType("topic");
  }

  function closeModal() {
    setModalType(null);
  }

  function handlePetSubmit(event) {
    event.preventDefault();

    if (!petForm.name.trim()) {
      alert("Please enter the pet type name.");
      return;
    }

    if (!petForm.emoji.trim()) {
      alert("Please enter an emoji for the pet type.");
      return;
    }

    if (petForm.id) {
      setPets((prevPets) =>
        prevPets.map((pet) =>
          pet.id === petForm.id
            ? {
                ...pet,
                name: petForm.name,
                emoji: petForm.emoji,
                description: petForm.description,
              }
            : pet
        )
      );

      closeModal();
      return;
    }

    const newPet = {
      id: Date.now(),
      name: petForm.name,
      emoji: petForm.emoji,
      description: petForm.description,
      status: "Active",
    };

    setPets((prevPets) => [...prevPets, newPet]);
    closeModal();
  }

  function handleDisablePet(id) {
    setPets((prevPets) =>
      prevPets.map((pet) =>
        pet.id === id ? { ...pet, status: "Disabled" } : pet
      )
    );
  }

  function handleEnablePet(id) {
    setPets((prevPets) =>
      prevPets.map((pet) =>
        pet.id === id ? { ...pet, status: "Active" } : pet
      )
    );
  }

  function handleArchivePet(id) {
    const confirmArchive = window.confirm(
      "Are you sure you want to archive this pet type? It will no longer appear on the customer side."
    );

    if (!confirmArchive) return;

    setPets((prevPets) =>
      prevPets.map((pet) =>
        pet.id === id ? { ...pet, status: "Archived" } : pet
      )
    );

    setTopics((prevTopics) =>
      prevTopics.map((topic) => {
        const topicPetIds = topic.petIds || [];

        if (!topicPetIds.includes(id)) {
          return topic;
        }

        const remainingPetIds = topicPetIds.filter((petId) => petId !== id);

        if (remainingPetIds.length === 0) {
          return {
            ...topic,
            petIds: [],
            status: "Archived",
          };
        }

        return {
          ...topic,
          petIds: remainingPetIds,
        };
      })
    );

    setTopicForm((prevForm) => ({
      ...prevForm,
      petIds: prevForm.petIds.filter((petId) => petId !== id),
    }));
  }

  function handleTopicPetToggle(petId) {
    setTopicForm((prevForm) => {
      const alreadySelected = prevForm.petIds.includes(petId);

      return {
        ...prevForm,
        petIds: alreadySelected
          ? prevForm.petIds.filter((id) => id !== petId)
          : [...prevForm.petIds, petId],
      };
    });
  }

  function handleTopicSubmit(event) {
    event.preventDefault();

    if (topicForm.petIds.length === 0) {
      alert("Please select at least one pet type.");
      return;
    }

    if (!topicForm.title.trim()) {
      alert("Please enter the emergency topic title.");
      return;
    }

    if (topicForm.id) {
      setTopics((prevTopics) =>
        prevTopics.map((topic) =>
          topic.id === topicForm.id
            ? {
                ...topic,
                petIds: topicForm.petIds,
                title: topicForm.title,
                severity: topicForm.severity,
                keywords: topicForm.keywords,
                status: topicForm.status,
              }
            : topic
        )
      );

      closeModal();
      return;
    }

    const newTopic = {
      id: Date.now(),
      petIds: topicForm.petIds,
      title: topicForm.title,
      severity: topicForm.severity,
      keywords: topicForm.keywords,
      status: topicForm.status,
    };

    setTopics((prevTopics) => [...prevTopics, newTopic]);
    closeModal();
  }

  function handleArchiveTopic(id) {
    const confirmArchive = window.confirm(
      "Are you sure you want to archive this emergency topic? It will no longer appear on the customer side."
    );

    if (!confirmArchive) return;

    setTopics((prevTopics) =>
      prevTopics.map((topic) =>
        topic.id === id ? { ...topic, status: "Archived" } : topic
      )
    );
  }

  function handlePublishTopic(id) {
    const topic = topics.find((item) => item.id === id);

    if (!topic) return;

    if (!topic.petIds || topic.petIds.length === 0) {
      alert(
        "Please edit this topic and select at least one active pet type before publishing."
      );
      return;
    }

    const hasActivePet = topic.petIds.some((petId) =>
      pets.some((pet) => pet.id === petId && pet.status === "Active")
    );

    if (!hasActivePet) {
      alert(
        "This topic must be linked to at least one active pet type before publishing."
      );
      return;
    }

    setTopics((prevTopics) =>
      prevTopics.map((item) =>
        item.id === id ? { ...item, status: "Published" } : item
      )
    );
  }

  function handleDraftTopic(id) {
    setTopics((prevTopics) =>
      prevTopics.map((topic) =>
        topic.id === id ? { ...topic, status: "Draft" } : topic
      )
    );
  }

  function getPetNames(petIds = []) {
    const linkedPets = pets.filter((pet) => petIds.includes(pet.id));

    if (linkedPets.length === 0) return "No linked pet";

    return linkedPets.map((pet) => `${pet.emoji} ${pet.name}`).join(", ");
  }

  function renderFloatingActionMenu() {
    if (!actionMenu) return null;

    if (actionMenu.type === "pet") {
      const pet = pets.find((item) => item.id === actionMenu.id);
      if (!pet) return null;

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
            <button onClick={() => openEditPetModal(pet)}>Edit</button>

            {pet.status === "Active" && (
              <button
                onClick={() => {
                  handleDisablePet(pet.id);
                  closeActionMenu();
                }}
              >
                Disable
              </button>
            )}

            {(pet.status === "Disabled" || pet.status === "Archived") && (
              <button
                onClick={() => {
                  handleEnablePet(pet.id);
                  closeActionMenu();
                }}
              >
                Enable
              </button>
            )}

            {pet.status !== "Archived" && (
              <button
                className="danger-text"
                onClick={() => {
                  handleArchivePet(pet.id);
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

    if (actionMenu.type === "topic") {
      const topic = topics.find((item) => item.id === actionMenu.id);
      if (!topic) return null;

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
            <button onClick={() => openEditTopicModal(topic)}>Edit</button>

            {topic.status === "Published" && (
              <button
                onClick={() => {
                  handleDraftTopic(topic.id);
                  closeActionMenu();
                }}
              >
                Move to Draft
              </button>
            )}

            {(topic.status === "Draft" || topic.status === "Archived") && (
              <button
                onClick={() => {
                  handlePublishTopic(topic.id);
                  closeActionMenu();
                }}
              >
                Publish
              </button>
            )}

            {topic.status !== "Archived" && (
              <button
                className="danger-text"
                onClick={() => {
                  handleArchiveTopic(topic.id);
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

  function renderPetModal() {
    if (modalType !== "pet") return null;

    return (
      <div className="modal-backdrop" onClick={closeModal}>
        <section className="admin-modal" onClick={(event) => event.stopPropagation()}>
          <div className="modal-header">
            <div>
              <p className="page-subtitle">Pet Type</p>
              <h2>{petForm.id ? "Edit Pet Type" : "Add Pet Type"}</h2>
            </div>

            <button className="modal-close-btn" onClick={closeModal}>
              ×
            </button>
          </div>

          <p className="form-note">
            Active pet types must be disabled before editing.
          </p>

          <form onSubmit={handlePetSubmit} className="admin-form">
            <label>
              Pet Type Name
              <input
                type="text"
                placeholder="Example: Dog"
                value={petForm.name}
                onChange={(e) =>
                  setPetForm({ ...petForm, name: e.target.value })
                }
              />
            </label>

            <label>
              Emoji
              <input
                type="text"
                placeholder="Example: 🐶"
                value={petForm.emoji}
                onChange={(e) =>
                  setPetForm({ ...petForm, emoji: e.target.value })
                }
              />
            </label>

            <label>
              Description
              <textarea
                rows="4"
                placeholder="Short description for this pet type"
                value={petForm.description}
                onChange={(e) =>
                  setPetForm({ ...petForm, description: e.target.value })
                }
              />
            </label>

            <div className="form-actions">
              <button type="submit" className="primary-btn">
                {petForm.id ? "Save Changes" : "+ Add Pet Type"}
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

  function renderTopicModal() {
    if (modalType !== "topic") return null;

    const petOptions = topicForm.id
      ? selectablePetsForTopic
      : availablePetsForNewTopic;

    return (
      <div className="modal-backdrop" onClick={closeModal}>
        <section className="admin-modal" onClick={(event) => event.stopPropagation()}>
          <div className="modal-header">
            <div>
              <p className="page-subtitle">Emergency Topic</p>
              <h2>
                {topicForm.id ? "Edit Emergency Topic" : "Add Emergency Topic"}
              </h2>
            </div>

            <button className="modal-close-btn" onClick={closeModal}>
              ×
            </button>
          </div>

          <p className="form-note">
            Emergency topics can be linked to one or more active pet types.
          </p>

          <form onSubmit={handleTopicSubmit} className="admin-form">
            <div className="admin-form-group">
              <p className="admin-form-label">Pet Type</p>

              <div className="checkbox-grid">
                {petOptions.map((pet) => (
                  <label key={pet.id} className="checkbox-card">
                    <input
                      type="checkbox"
                      checked={topicForm.petIds.includes(pet.id)}
                      onChange={() => handleTopicPetToggle(pet.id)}
                    />

                    <span>
                      {pet.emoji} {pet.name}
                      {pet.status !== "Active" && (
                        <small> ({pet.status})</small>
                      )}
                    </span>
                  </label>
                ))}
              </div>

              {topicForm.petIds.length > 0 && (
                <p className="selected-note">
                  Selected:{" "}
                  {pets
                    .filter((pet) => topicForm.petIds.includes(pet.id))
                    .map((pet) => pet.name)
                    .join(", ")}
                </p>
              )}
            </div>

            <label>
              Emergency Topic Title
              <input
                type="text"
                placeholder="Example: Choking"
                value={topicForm.title}
                onChange={(e) =>
                  setTopicForm({ ...topicForm, title: e.target.value })
                }
              />
            </label>

            <label>
              Severity
              <select
                value={topicForm.severity}
                onChange={(e) =>
                  setTopicForm({ ...topicForm, severity: e.target.value })
                }
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </label>

            <label>
              Keywords
              <input
                type="text"
                placeholder="Example: choking, breathing, airway"
                value={topicForm.keywords}
                onChange={(e) =>
                  setTopicForm({ ...topicForm, keywords: e.target.value })
                }
              />
            </label>

            <label>
              Status
              <select
                value={topicForm.status}
                onChange={(e) =>
                  setTopicForm({ ...topicForm, status: e.target.value })
                }
              >
                <option value="Draft">Draft</option>
                <option value="Published">Published</option>
                <option value="Archived">Archived</option>
              </select>
            </label>

            <div className="form-actions">
              <button type="submit" className="primary-btn">
                {topicForm.id ? "Save Changes" : "+ Add Topic"}
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

  return (
    <div className="admin-page">
      {renderFloatingActionMenu()}
      {renderPetModal()}
      {renderTopicModal()}

      <div className="page-title-row">
        <div className="page-title-area">
          <p className="page-subtitle">Admin Management</p>
          <h1>Pet Types & Emergency Topics</h1>
        </div>
      </div>

      <div className="admin-tabs">
        <button
          className={activeTab === "pets" ? "active" : ""}
          onClick={() => {
            setActiveTab("pets");
            closeActionMenu();
          }}
        >
          Pet Types
        </button>

        <button
          className={activeTab === "topics" ? "active" : ""}
          onClick={() => {
            setActiveTab("topics");
            closeActionMenu();
          }}
        >
          Emergency Topics
        </button>
      </div>

      {activeTab === "pets" && (
        <section className="admin-table-card">
          <div className="table-header-row">
            <div>
              <h2>Pet Type List</h2>
              <p className="form-note">
                If a pet type is archived, it is removed from shared emergency
                topics. Topics are only archived automatically when no pet type
                is left.
              </p>
            </div>

            <button className="primary-btn table-add-btn" onClick={openAddPetModal}>
              + Add Pet Type
            </button>
          </div>

          <p className="table-scroll-note">
            Scroll sideways to view more columns on smaller screens.
          </p>

          <div className="table-responsive">
            <table className="admin-table pet-table">
              <thead>
                <tr>
                  <th>Pet Type</th>
                  <th>Emoji</th>
                  <th>Topics</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {pets.map((pet) => {
                  const topicCount = topics.filter(
                    (topic) =>
                      (topic.petIds || []).includes(pet.id) &&
                      topic.status !== "Archived"
                  ).length;

                  return (
                    <tr key={pet.id}>
                      <td>
                        <strong className="cell-title">{pet.name}</strong>
                        <p className="table-small-text">{pet.description}</p>
                      </td>

                      <td>{pet.emoji}</td>

                      <td>{topicCount}</td>

                      <td>
                        <span
                          className={
                            pet.status === "Active"
                              ? "status-badge"
                              : pet.status === "Disabled"
                              ? "status-badge disabled"
                              : "status-badge archived"
                          }
                        >
                          {pet.status}
                        </span>
                      </td>

                      <td>
                        <button
                          className="three-dot-btn"
                          onClick={(event) =>
                            openActionMenu(event, "pet", pet.id)
                          }
                        >
                          ⋯
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {activeTab === "topics" && (
        <section className="admin-table-card">
          <div className="table-header-row">
            <div>
              <h2>Emergency Topic List</h2>
              <p className="form-note">
                Archived topics can be published again if they are linked to at
                least one active pet type.
              </p>
            </div>

            <button className="primary-btn table-add-btn" onClick={openAddTopicModal}>
              + Add Topic
            </button>
          </div>

          <div className="filter-row">
            <input
              type="text"
              placeholder="Search by title, keyword, or pet type..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
            />

            <select
              value={selectedPetFilter}
              onChange={(e) => setSelectedPetFilter(e.target.value)}
            >
              <option value="All">All Pet Types</option>
              {pets.map((pet) => (
                <option key={pet.id} value={pet.id}>
                  {pet.emoji} {pet.name}
                </option>
              ))}
            </select>
          </div>

          <p className="table-scroll-note">
            Scroll sideways to view more columns on smaller screens.
          </p>

          <div className="table-responsive">
            <table className="admin-table topic-table">
              <thead>
                <tr>
                  <th>Topic</th>
                  <th>Pet Type</th>
                  <th>Severity</th>
                  <th>Keywords</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredTopics.length > 0 ? (
                  filteredTopics.map((topic) => (
                    <tr key={topic.id}>
                      <td>
                        <strong className="cell-title">{topic.title}</strong>
                      </td>

                      <td>
                        <span className="long-table-text">
                          {getPetNames(topic.petIds)}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`severity-badge ${topic.severity.toLowerCase()}`}
                        >
                          {topic.severity}
                        </span>
                      </td>

                      <td>
                        <span className="long-table-text">
                          {topic.keywords}
                        </span>
                      </td>

                      <td>
                        <span
                          className={
                            topic.status === "Published"
                              ? "status-badge"
                              : topic.status === "Draft"
                              ? "status-badge draft"
                              : "status-badge archived"
                          }
                        >
                          {topic.status}
                        </span>
                      </td>

                      <td>
                        <button
                          className="three-dot-btn"
                          onClick={(event) =>
                            openActionMenu(event, "topic", topic.id)
                          }
                        >
                          ⋯
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="empty-table-text">
                      No emergency topics found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

export default ManagePetEmergency;