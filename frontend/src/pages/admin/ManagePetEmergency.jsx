import { useEffect, useMemo, useState } from "react";
import "../../styles/admin.css";
import "../../styles/managePetEmergency.css";

const API_URL = import.meta.env.VITE_API_URL;

function ManagePetEmergency() {
  const [activeTab, setActiveTab] = useState("pets");
  const [actionMenu, setActionMenu] = useState(null);
  const [modalType, setModalType] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [pets, setPets] = useState([]);
  const [topics, setTopics] = useState([]);

  const [petForm, setPetForm] = useState({ id: null, name: "", emoji: "", description: "" });
  const [topicForm, setTopicForm] = useState({ id: null, petIds: [], title: "", description: "", severity: "Mild", keywords: "", status: "Draft" });

  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedPetFilter, setSelectedPetFilter] = useState("All");

  const token = localStorage.getItem("token");

  // ── Fetch pets and topics on mount ───────────────────────
  useEffect(() => {
    async function fetchData() {
      try {
        const [petsRes, topicsRes] = await Promise.all([
          fetch(`${API_URL}/api/admin/pets`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_URL}/api/admin/emergency-cases`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        const petsData = await petsRes.json();
        const topicsData = await topicsRes.json();
        setPets((petsData.pets || []).map((p) => ({
          id: p.petID,
          name: p.petName,
          emoji: p.icon || "🐾",
          description: p.petDesc || "",
          status: p.status,
        })));
        // response key is `cases`, not `topics`
        setTopics((topicsData.cases || []).map((t) => ({
          id: t.emergencyID,
          petIds: t.petID ? [t.petID] : [],
          title: t.topicTitle,
          description: t.topicDesc || "",
          severity: t.severity,
          keywords: t.keywords || "",
          status: t.status,
        })));
      } catch (err) {
        setError("Failed to load data. " + err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

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
        selectedPetFilter === "All" || topicPetIds.includes(Number(selectedPetFilter));
      return matchesSearch && matchesPet;
    });
  }, [topics, pets, searchKeyword, selectedPetFilter]);

  // ── Action menu ───────────────────────────────────────────
  function openActionMenu(event, type, id) {
    const rect = event.currentTarget.getBoundingClientRect();
    const menuWidth = 180;
    const gap = 10;
    const hasSpaceRight = window.innerWidth - rect.right > menuWidth + gap;
    const left = hasSpaceRight ? rect.right + gap : Math.max(12, rect.left - menuWidth - gap);
    const top = Math.min(rect.top, window.innerHeight - 220);
    setActionMenu({ type, id, left, top });
  }

  function closeActionMenu() { setActionMenu(null); }

  // ── Pet modal ─────────────────────────────────────────────
  function openAddPetModal() {
    closeActionMenu();
    setPetForm({ id: null, name: "", emoji: "", description: "" });
    setModalType("pet");
  }

  function openEditPetModal(pet) {
    closeActionMenu();
    setPetForm({ id: pet.id, name: pet.name, emoji: pet.emoji || "🐾", description: pet.description || "" });
    setModalType("pet");
  }

  // ── Topic modal ───────────────────────────────────────────
  function openAddTopicModal() {
    closeActionMenu();
    setTopicForm({ id: null, petIds: [], title: "", description: "", severity: "Mild", keywords: "", status: "Draft" });
    setModalType("topic");
  }

  function openEditTopicModal(topic) {
    closeActionMenu();
    setTopicForm({ id: topic.id, petIds: topic.petIds || [], title: topic.title, description: topic.description || "", severity: topic.severity, keywords: topic.keywords, status: topic.status });
    setActiveTab("topics");
    setModalType("topic");
  }

  function closeModal() { setModalType(null); }

  // ── Pet CRUD ──────────────────────────────────────────────
  async function handlePetSubmit(event) {
    event.preventDefault();
    if (!petForm.name.trim()) { alert("Please enter the pet type name."); return; }
    if (!petForm.emoji.trim()) { alert("Please enter an emoji for the pet type."); return; }

    const body = { petName: petForm.name, icon: petForm.emoji, petDesc: petForm.description };

    try {
      if (petForm.id) {
        const res = await fetch(`${API_URL}/api/admin/pets/${petForm.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(body),
        });
        if (!res.ok) { const d = await res.json(); alert(d.message || "Failed to update pet."); return; }
        setPets((prev) => prev.map((p) => p.id === petForm.id ? { ...p, name: petForm.name, emoji: petForm.emoji, description: petForm.description } : p));
      } else {
        const res = await fetch(`${API_URL}/api/admin/pets`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ ...body, status: "Active" }),
        });
        if (!res.ok) { const d = await res.json(); alert(d.message || "Failed to add pet."); return; }
        const d = await res.json();
        setPets((prev) => [...prev, { id: d.petID, name: petForm.name, emoji: petForm.emoji, description: petForm.description, status: "Active" }]);
      }
      closeModal();
    } catch { alert("Server error. Please try again."); }
  }

  // PUT requires petName — always send full pet data when updating status
  async function updatePetStatus(id, newStatus) {
    const pet = pets.find((p) => p.id === id);
    if (!pet) return;
    const payload = {
      petName: pet.name || "",
      icon: pet.emoji || "🐾",
      petDesc: pet.description || "",
      status: newStatus,
    };
    try {
      const res = await fetch(`${API_URL}/api/admin/pets/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const d = await res.json();
      if (!res.ok) { alert(d.message || "Failed to update pet."); console.error("Pet update error:", d); return; }
      setPets((prev) => prev.map((p) => p.id === id ? { ...p, status: newStatus } : p));
    } catch (err) { console.error("Pet update fetch error:", err); alert("Server error."); }
  }

  function handleTogglePetStatus(id) {
    const pet = pets.find((p) => p.id === id);
    if (!pet) return;
    updatePetStatus(id, pet.status === "Active" ? "Disabled" : "Active");
  }



  async function handleDeletePet(id) {
    if (!window.confirm("Are you sure you want to permanently delete this pet type? This cannot be undone.")) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/pets/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) { const d = await res.json(); alert(d.message || "Failed to delete pet."); return; }
      setPets((prev) => prev.filter((p) => p.id !== id));
    } catch { alert("Server error."); }
  }

  // ── Topic CRUD ────────────────────────────────────────────
  function handleTopicPetToggle(petId) {
    setTopicForm((prev) => ({
      ...prev,
      petIds: prev.petIds.includes(petId)
        ? prev.petIds.filter((id) => id !== petId)
        : [...prev.petIds, petId],
    }));
  }

  async function handleTopicSubmit(event) {
    event.preventDefault();
    if (topicForm.petIds.length === 0) { alert("Please select at least one pet type."); return; }
    if (!topicForm.title.trim()) { alert("Please enter the emergency topic title."); return; }

    const body = {
      petID: topicForm.petIds[0],
      topicTitle: topicForm.title,
      topicDesc: topicForm.description || topicForm.title,
      severity: topicForm.severity,
      keywords: topicForm.keywords,
      status: topicForm.status,
    };

    try {
      if (topicForm.id) {
        const res = await fetch(`${API_URL}/api/admin/emergency-cases/${topicForm.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(body),
        });
        if (!res.ok) { const d = await res.json(); alert(d.message || "Failed to update topic."); return; }
        setTopics((prev) => prev.map((t) => t.id === topicForm.id ? { ...t, petIds: topicForm.petIds, title: topicForm.title, severity: topicForm.severity, keywords: topicForm.keywords, status: topicForm.status } : t));
      } else {
        const res = await fetch(`${API_URL}/api/admin/emergency-cases`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(body),
        });
        if (!res.ok) { const d = await res.json(); alert(d.message || "Failed to add topic."); return; }
        const d = await res.json();
        setTopics((prev) => [...prev, { id: d.emergencyID, petIds: topicForm.petIds, title: topicForm.title, severity: topicForm.severity, keywords: topicForm.keywords, status: topicForm.status }]);
      }
      closeModal();
    } catch { alert("Server error. Please try again."); }
  }

  async function handleDeleteTopic(id) {
    if (!window.confirm("Are you sure you want to permanently delete this topic? This cannot be undone.")) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/emergency-cases/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) { const d = await res.json(); alert(d.message || "Failed to delete topic."); return; }
      setTopics((prev) => prev.filter((t) => t.id !== id));
    } catch { alert("Server error."); }
  }

  async function handleToggleTopicStatus(id) {
    const topic = topics.find((t) => t.id === id);
    if (!topic) return;
    const newStatus = topic.status === "Published" ? "Draft" : "Published";
    const hasActivePet = (topic.petIds || []).some((petId) =>
      pets.some((p) => p.id === petId && p.status === "Active")
    );
    if (newStatus === "Published" && !hasActivePet) {
      alert("This topic must be linked to at least one active pet type before publishing.");
      return;
    }
    try {
      const res = await fetch(`${API_URL}/api/admin/emergency-cases/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          petID: topic.petIds[0],
          topicTitle: topic.title,
          topicDesc: topic.description || topic.title,
          severity: topic.severity,
          keywords: topic.keywords,
          status: newStatus,
        }),
      });
      if (!res.ok) { const d = await res.json(); alert(d.message || "Failed to update topic."); return; }
      setTopics((prev) => prev.map((t) => t.id === id ? { ...t, status: newStatus } : t));
    } catch { alert("Server error."); }
  }



  // ── Helpers ───────────────────────────────────────────────
  function getPetNames(petIds = []) {
    const linkedPets = pets.filter((pet) => petIds.includes(pet.id));
    if (linkedPets.length === 0) return "No linked pet";
    return linkedPets.map((pet) => `${pet.emoji} ${pet.name}`).join(", ");
  }

  // ── Render floating action menu ───────────────────────────
  function renderFloatingActionMenu() {
    if (!actionMenu) return null;

    if (actionMenu.type === "pet") {
      const pet = pets.find((item) => item.id === actionMenu.id);
      if (!pet) return null;
      return (
        <>
          <div className="floating-menu-backdrop" onClick={closeActionMenu} />
          <div className="floating-action-menu" style={{ left: `${actionMenu.left}px`, top: `${actionMenu.top}px` }}>
            <button onClick={() => openEditPetModal(pet)}>Edit</button>
            <button onClick={() => { handleTogglePetStatus(pet.id); closeActionMenu(); }}>
              {pet.status === "Active" ? "Set Inactive" : "Set Active"}
            </button>
            <button className="danger-text" onClick={() => { handleDeletePet(pet.id); closeActionMenu(); }}>Delete</button>
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
          <div className="floating-action-menu" style={{ left: `${actionMenu.left}px`, top: `${actionMenu.top}px` }}>
            <button onClick={() => openEditTopicModal(topic)}>Edit</button>
            <button onClick={() => { handleToggleTopicStatus(topic.id); closeActionMenu(); }}>
              {topic.status === "Published" ? "Set to Draft" : "Publish"}
            </button>
            <button className="danger-text" onClick={() => { handleDeleteTopic(topic.id); closeActionMenu(); }}>Delete</button>
          </div>
        </>
      );
    }

    return null;
  }

  // ── Render pet modal ──────────────────────────────────────
  function renderPetModal() {
    if (modalType !== "pet") return null;
    return (
      <div className="modal-backdrop" onClick={closeModal}>
        <section className="admin-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <div>
              <p className="page-subtitle">Pet Type</p>
              <h2>{petForm.id ? "Edit Pet Type" : "Add Pet Type"}</h2>
            </div>
            <button className="modal-close-btn" onClick={closeModal}>×</button>
          </div>
          <form onSubmit={handlePetSubmit} className="admin-form">
            <label>
              Pet Type Name
              <input type="text" placeholder="Example: Dog" value={petForm.name} onChange={(e) => setPetForm({ ...petForm, name: e.target.value })} />
            </label>
            <label>
              Emoji
              <input type="text" placeholder="Example: 🐶" value={petForm.emoji} onChange={(e) => setPetForm({ ...petForm, emoji: e.target.value })} />
            </label>
            <label>
              Description
              <textarea rows="4" placeholder="Short description for this pet type" value={petForm.description} onChange={(e) => setPetForm({ ...petForm, description: e.target.value })} />
            </label>
            <div className="form-actions">
              <button type="submit" className="primary-btn">{petForm.id ? "Save Changes" : "+ Add Pet Type"}</button>
              <button type="button" className="secondary-btn" onClick={closeModal}>Cancel</button>
            </div>
          </form>
        </section>
      </div>
    );
  }

  // ── Render topic modal ────────────────────────────────────
  function renderTopicModal() {
    if (modalType !== "topic") return null;
    const petOptions = topicForm.id ? selectablePetsForTopic : availablePetsForNewTopic;
    return (
      <div className="modal-backdrop" onClick={closeModal}>
        <section className="admin-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <div>
              <p className="page-subtitle">Emergency Topic</p>
              <h2>{topicForm.id ? "Edit Emergency Topic" : "Add Emergency Topic"}</h2>
            </div>
            <button className="modal-close-btn" onClick={closeModal}>×</button>
          </div>
          <p className="form-note">Emergency topics can be linked to one or more active pet types.</p>
          <form onSubmit={handleTopicSubmit} className="admin-form">
            <div className="admin-form-group">
              <p className="admin-form-label">Pet Type</p>
              <div className="checkbox-grid">
                {petOptions.map((pet) => (
                  <label key={pet.id} className="checkbox-card">
                    <input type="checkbox" checked={topicForm.petIds.includes(pet.id)} onChange={() => handleTopicPetToggle(pet.id)} />
                    <span>{pet.emoji} {pet.name}{pet.status !== "Active" && <small> ({pet.status})</small>}</span>
                  </label>
                ))}
              </div>
              {topicForm.petIds.length > 0 && (
                <p className="selected-note">
                  Selected: {pets.filter((pet) => topicForm.petIds.includes(pet.id)).map((pet) => pet.name).join(", ")}
                </p>
              )}
            </div>
            <label>
              Emergency Topic Title
              <input type="text" placeholder="Example: Choking" value={topicForm.title} onChange={(e) => setTopicForm({ ...topicForm, title: e.target.value })} />
            </label>
            <label>
              Description
              <textarea rows="3" placeholder="Brief description of this emergency" value={topicForm.description} onChange={(e) => setTopicForm({ ...topicForm, description: e.target.value })} />
            </label>
            <label>
              Severity
              <select value={topicForm.severity} onChange={(e) => setTopicForm({ ...topicForm, severity: e.target.value })}>
                <option value="Mild">Mild</option>
                <option value="Moderate">Moderate</option>
                <option value="Critical">Critical</option>
              </select>
            </label>
            <label>
              Keywords
              <input type="text" placeholder="Example: choking, breathing, airway" value={topicForm.keywords} onChange={(e) => setTopicForm({ ...topicForm, keywords: e.target.value })} />
            </label>
            <label>
              Status
              <select value={topicForm.status} onChange={(e) => setTopicForm({ ...topicForm, status: e.target.value })}>
                <option value="Draft">Draft</option>
                <option value="Published">Published</option>
              </select>
            </label>
            <div className="form-actions">
              <button type="submit" className="primary-btn">{topicForm.id ? "Save Changes" : "+ Add Topic"}</button>
              <button type="button" className="secondary-btn" onClick={closeModal}>Cancel</button>
            </div>
          </form>
        </section>
      </div>
    );
  }

  // ── Main render ───────────────────────────────────────────
  if (loading) return <div className="admin-page"><p>Loading…</p></div>;
  if (error) return <div className="admin-page"><p style={{ color: "crimson" }}>{error}</p></div>;

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
        <button className={activeTab === "pets" ? "active" : ""} onClick={() => { setActiveTab("pets"); closeActionMenu(); }}>Pet Types</button>
        <button className={activeTab === "topics" ? "active" : ""} onClick={() => { setActiveTab("topics"); closeActionMenu(); }}>Emergency Topics</button>
      </div>

      {activeTab === "pets" && (
        <section className="admin-table-card">
          <div className="table-header-row">
            <div>
              <h2>Pet Type List</h2>
              <p className="form-note">Disabled pet types are hidden from users but can be re-enabled. Delete permanently removes the pet type.</p>
            </div>
            <button className="primary-btn table-add-btn" onClick={openAddPetModal}>+ Add Pet Type</button>
          </div>
          <p className="table-scroll-note">Scroll sideways to view more columns on smaller screens.</p>
          <div className="table-responsive">
            <table className="admin-table pet-table">
              <thead>
                <tr><th>Pet Type</th><th>Emoji</th><th>Topics</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {pets.map((pet) => {
                  const topicCount = topics.filter((t) => (t.petIds || []).includes(pet.id) && t.status === "Published").length;
                  return (
                    <tr key={pet.id}>
                      <td><strong className="cell-title">{pet.name}</strong><p className="table-small-text">{pet.description}</p></td>
                      <td>{pet.emoji}</td>
                      <td>{topicCount}</td>
                      <td>
                        <span className={pet.status === "Active" ? "status-badge" : "status-badge suspended"}>
                          {pet.status}
                        </span>
                      </td>
                      <td><button className="three-dot-btn" onClick={(e) => openActionMenu(e, "pet", pet.id)}>⋯</button></td>
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
              <p className="form-note">Draft topics are hidden from users. Published topics are visible. Delete permanently removes the topic.</p>
            </div>
            <button className="primary-btn table-add-btn" onClick={openAddTopicModal}>+ Add Topic</button>
          </div>
          <div className="filter-row">
            <input type="text" placeholder="Search by title, keyword, or pet type..." value={searchKeyword} onChange={(e) => setSearchKeyword(e.target.value)} />
            <select value={selectedPetFilter} onChange={(e) => setSelectedPetFilter(e.target.value)}>
              <option value="All">All Pet Types</option>
              {pets.map((pet) => (<option key={pet.id} value={pet.id}>{pet.emoji} {pet.name}</option>))}
            </select>
          </div>
          <p className="table-scroll-note">Scroll sideways to view more columns on smaller screens.</p>
          <div className="table-responsive">
            <table className="admin-table topic-table">
              <thead>
                <tr><th>Topic</th><th>Pet Type</th><th>Severity</th><th>Keywords</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {filteredTopics.length > 0 ? (
                  filteredTopics.map((topic) => (
                    <tr key={topic.id}>
                      <td><strong className="cell-title">{topic.title}</strong></td>
                      <td><span className="long-table-text">{getPetNames(topic.petIds)}</span></td>
                      <td><span className={`severity-badge ${topic.severity?.toLowerCase()}`}>{topic.severity}</span></td>
                      <td><span className="long-table-text">{topic.keywords}</span></td>
                      <td>
                        <span className={topic.status === "Published" ? "status-badge" : "status-badge draft"}>
                          {topic.status}
                        </span>
                      </td>
                      <td><button className="three-dot-btn" onClick={(e) => openActionMenu(e, "topic", topic.id)}>⋯</button></td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="6" className="empty-table-text">No emergency topics found.</td></tr>
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