import { useEffect, useMemo, useState, useCallback } from "react";
import "../../styles/admin.css";
import "../../styles/managePetEmergency.css";

const API_URL = import.meta.env.VITE_API_URL;

/* ─────────────────────────────────────────────────────────────
   Toast system
   ───────────────────────────────────────────────────────────── */

let _toastId = 0;

function useToast() {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = "success") => {
    const id = ++_toastId;
    setToasts((prev) => [...prev, { id, message, type, exiting: false }]);
    setTimeout(() => setToasts((prev) => prev.map((t) => t.id === id ? { ...t, exiting: true } : t)), 2800);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3100);
  }, []);

  return { toasts, addToast };
}

const TOAST_ICON = { success: "✅", error: "⚠️", warning: "⚡" };

function ToastPortal({ toasts }) {
  if (!toasts.length) return null;
  return (
    <div className="mpe-toast-portal" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`mpe-toast mpe-toast-${t.type}${t.exiting ? " mpe-toast-exit" : ""}`}>
          <span className="mpe-toast-icon">{TOAST_ICON[t.type] ?? "ℹ️"}</span>
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Confirm-delete modal 
   ───────────────────────────────────────────────────────────── */

function ConfirmDeleteModal({ item, onCancel, onConfirm, busy }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape" && !busy) onCancel(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel, busy]);

  return (
    <div className="mpe-overlay" onClick={(e) => { if (e.target === e.currentTarget && !busy) onCancel(); }}
      role="dialog" aria-modal="true" aria-labelledby="mpe-del-title">
      <div className="mpe-confirm-modal">
        <div className="mpe-confirm-icon" aria-hidden="true">🗑️</div>
        <h2 id="mpe-del-title">Delete {item.kind}?</h2>
        <p>You are about to permanently delete:</p>
        <p><strong>"{item.label}"</strong></p>
        <div className="mpe-confirm-warning">
          ⚠️ This action cannot be undone. All associated data will be lost.
        </div>
        <div className="mpe-confirm-actions">
          <button className="mpe-btn-cancel" onClick={onCancel} disabled={busy}>Keep It</button>
          <button className="mpe-btn-danger" onClick={onConfirm} disabled={busy}>
            {busy ? <><span className="mpe-spinner" />&nbsp;Deleting…</> : "🗑️ Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Confirm-status modal 
   ───────────────────────────────────────────────────────────── */

function ConfirmStatusModal({ item, onCancel, onConfirm, busy }) {
  const isActivating = item.nextStatus === "Active" || item.nextStatus === "Published";

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape" && !busy) onCancel(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel, busy]);

  return (
    <div className="mpe-overlay" onClick={(e) => { if (e.target === e.currentTarget && !busy) onCancel(); }}
      role="dialog" aria-modal="true" aria-labelledby="mpe-status-title">
      <div className="mpe-confirm-modal">
        <div className={`mpe-status-icon ${isActivating ? "mpe-status-icon-activate" : "mpe-status-icon-deactivate"}`}
          aria-hidden="true">
          {isActivating ? "✅" : "⏸️"}
        </div>
        <h2 id="mpe-status-title">
          {isActivating ? `Set to ${item.nextStatus}?` : `Set to ${item.nextStatus}?`}
        </h2>
        <p>
          {item.kind}: <strong>"{item.label}"</strong>
        </p>
        <p style={{ marginBottom: 24 }}>
          {isActivating
            ? `This will make the ${item.kind.toLowerCase()} visible and active.`
            : `This will hide the ${item.kind.toLowerCase()} from users.`}
        </p>
        <div className="mpe-confirm-actions">
          <button className="mpe-btn-cancel" onClick={onCancel} disabled={busy}>Cancel</button>
          <button className="mpe-btn-confirm" onClick={onConfirm} disabled={busy}>
            {busy ? <><span className="mpe-spinner" />&nbsp;Saving…</> : `Confirm`}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Result modal  
   ───────────────────────────────────────────────────────────── */

function ResultModal({ result, onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const ok = result.type === "success";
  return (
    <div className="mpe-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog" aria-modal="true" aria-labelledby="mpe-result-title">
      <div className="mpe-result-modal">
        <div className={`mpe-result-hero ${ok ? "mpe-result-hero-success" : "mpe-result-hero-error"}`}>
          <div className={`mpe-result-icon ${ok ? "mpe-result-icon-success" : "mpe-result-icon-error"}`}
            aria-hidden="true">
            {ok ? "🎉" : "❌"}
          </div>
          <h2 id="mpe-result-title">{result.title}</h2>
          <p>{result.message}</p>
        </div>
        <div className="mpe-result-body">
          <button className="mpe-btn-close" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Main page
   ───────────────────────────────────────────────────────────── */

function ManagePetEmergency() {
  const { toasts, addToast } = useToast();

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

  // Confirmation modal state
  const [deleteTarget, setDeleteTarget] = useState(null);   // { kind, label, id, entity }
  const [statusTarget, setStatusTarget] = useState(null);   // { kind, label, id, entity, nextStatus }
  const [actionBusy, setActionBusy] = useState(false);

  // Result modal state
  const [resultModal, setResultModal] = useState(null);     // { type, title, message }

  const token = localStorage.getItem("token");

  /* ── Fetch on mount ─────────────────────────────────────── */
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

  /* ── Action menu ─────────────────────────────────────────── */
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

  /* ── Pet modal ───────────────────────────────────────────── */
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

  /* ── Topic modal ─────────────────────────────────────────── */
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

  /* ── Pet CRUD ────────────────────────────────────────────── */
  async function handlePetSubmit(event) {
    event.preventDefault();
    if (!petForm.name.trim()) {
      addToast("Please enter the pet type name.", "warning");
      return;
    }
    if (!petForm.emoji.trim()) {
      addToast("Please enter an emoji for the pet type.", "warning");
      return;
    }

    const body = { petName: petForm.name, icon: petForm.emoji, petDesc: petForm.description };
    const isEdit = Boolean(petForm.id);

    try {
      if (isEdit) {
        const res = await fetch(`${API_URL}/api/admin/pets/${petForm.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const d = await res.json();
          setResultModal({ type: "error", title: "Update Failed", message: d.message || "Failed to update pet type." });
          return;
        }
        setPets((prev) => prev.map((p) => p.id === petForm.id
          ? { ...p, name: petForm.name, emoji: petForm.emoji, description: petForm.description }
          : p
        ));
        closeModal();
        setResultModal({ type: "success", title: "Pet Type Updated", message: `"${petForm.name}" has been updated successfully.` });
      } else {
        const res = await fetch(`${API_URL}/api/admin/pets`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ ...body, status: "Active" }),
        });
        if (!res.ok) {
          const d = await res.json();
          setResultModal({ type: "error", title: "Add Failed", message: d.message || "Failed to add pet type." });
          return;
        }
        const d = await res.json();
        setPets((prev) => [...prev, { id: d.petID, name: petForm.name, emoji: petForm.emoji, description: petForm.description, status: "Active" }]);
        closeModal();
        setResultModal({ type: "success", title: "Pet Type Added", message: `"${petForm.name}" has been added successfully.` });
      }
    } catch {
      setResultModal({ type: "error", title: "Server Error", message: "Something went wrong. Please try again." });
    }
  }

  async function updatePetStatus(id, newStatus) {
    const pet = pets.find((p) => p.id === id);
    if (!pet) return;
    const payload = { petName: pet.name || "", icon: pet.emoji || "🐾", petDesc: pet.description || "", status: newStatus };
    try {
      const res = await fetch(`${API_URL}/api/admin/pets/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const d = await res.json();
      if (!res.ok) {
        addToast(d.message || "Failed to update pet status.", "error");
        return;
      }
      setPets((prev) => prev.map((p) => p.id === id ? { ...p, status: newStatus } : p));
      addToast(`"${pet.name}" set to ${newStatus}.`, "success");
    } catch {
      addToast("Server error. Please try again.", "error");
    }
  }

  /* Toggle → open status confirm modal */
  function handleTogglePetStatus(id) {
    closeActionMenu();
    const pet = pets.find((p) => p.id === id);
    if (!pet) return;
    const nextStatus = pet.status === "Active" ? "Disabled" : "Active";
    setStatusTarget({ kind: "Pet Type", label: pet.name, id, entity: "pet", nextStatus });
  }

  async function executePetStatusToggle() {
    if (!statusTarget) return;
    setActionBusy(true);
    await updatePetStatus(statusTarget.id, statusTarget.nextStatus);
    setActionBusy(false);
    setStatusTarget(null);
  }

  /* Delete → open confirm modal */
  function handleDeletePet(id) {
    closeActionMenu();
    const pet = pets.find((p) => p.id === id);
    if (!pet) return;
    setDeleteTarget({ kind: "Pet Type", label: pet.name, id, entity: "pet" });
  }

  async function executeDeletePet() {
    if (!deleteTarget) return;
    setActionBusy(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/pets/${deleteTarget.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const d = await res.json();
        setActionBusy(false);
        setDeleteTarget(null);
        addToast(d.message || "Failed to delete pet type.", "error");
        return;
      }
      setPets((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      setActionBusy(false);
      setDeleteTarget(null);
      addToast(`"${deleteTarget.label}" has been permanently deleted.`, "success");
    } catch {
      setActionBusy(false);
      setDeleteTarget(null);
      addToast("Server error. Please try again.", "error");
    }
  }

  /* ── Topic CRUD ──────────────────────────────────────────── */
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
    if (topicForm.petIds.length === 0) {
      addToast("Please select at least one pet type.", "warning");
      return;
    }
    if (!topicForm.title.trim()) {
      addToast("Please enter the emergency topic title.", "warning");
      return;
    }

    const body = {
      petID: topicForm.petIds[0],
      topicTitle: topicForm.title,
      topicDesc: topicForm.description || topicForm.title,
      severity: topicForm.severity,
      keywords: topicForm.keywords,
      status: topicForm.status,
    };
    const isEdit = Boolean(topicForm.id);

    try {
      if (isEdit) {
        const res = await fetch(`${API_URL}/api/admin/emergency-cases/${topicForm.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const d = await res.json();
          setResultModal({ type: "error", title: "Update Failed", message: d.message || "Failed to update topic." });
          return;
        }
        setTopics((prev) => prev.map((t) => t.id === topicForm.id
          ? { ...t, petIds: topicForm.petIds, title: topicForm.title, severity: topicForm.severity, keywords: topicForm.keywords, status: topicForm.status }
          : t
        ));
        closeModal();
        setResultModal({ type: "success", title: "Topic Updated", message: `"${topicForm.title}" has been updated successfully.` });
      } else {
        const res = await fetch(`${API_URL}/api/admin/emergency-cases`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const d = await res.json();
          setResultModal({ type: "error", title: "Add Failed", message: d.message || "Failed to add topic." });
          return;
        }
        const d = await res.json();
        setTopics((prev) => [...prev, { id: d.emergencyID, petIds: topicForm.petIds, title: topicForm.title, severity: topicForm.severity, keywords: topicForm.keywords, status: topicForm.status }]);
        closeModal();
        setResultModal({ type: "success", title: "Topic Added", message: `"${topicForm.title}" has been added successfully.` });
      }
    } catch {
      setResultModal({ type: "error", title: "Server Error", message: "Something went wrong. Please try again." });
    }
  }

  /* Delete topic → open confirm modal */
  function handleDeleteTopic(id) {
    closeActionMenu();
    const topic = topics.find((t) => t.id === id);
    if (!topic) return;
    setDeleteTarget({ kind: "Emergency Topic", label: topic.title, id, entity: "topic" });
  }

  async function executeDeleteTopic() {
    if (!deleteTarget) return;
    setActionBusy(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/emergency-cases/${deleteTarget.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const d = await res.json();
        setActionBusy(false);
        setDeleteTarget(null);
        addToast(d.message || "Failed to delete topic.", "error");
        return;
      }
      setTopics((prev) => prev.filter((t) => t.id !== deleteTarget.id));
      setActionBusy(false);
      setDeleteTarget(null);
      addToast(`"${deleteTarget.label}" has been permanently deleted.`, "success");
    } catch {
      setActionBusy(false);
      setDeleteTarget(null);
      addToast("Server error. Please try again.", "error");
    }
  }

  /* Toggle topic status → open confirm modal */
  function handleToggleTopicStatus(id) {
    closeActionMenu();
    const topic = topics.find((t) => t.id === id);
    if (!topic) return;
    const nextStatus = topic.status === "Published" ? "Draft" : "Published";
    const hasActivePet = (topic.petIds || []).some((petId) =>
      pets.some((p) => p.id === petId && p.status === "Active")
    );
    if (nextStatus === "Published" && !hasActivePet) {
      addToast("This topic must be linked to at least one active pet type before publishing.", "warning");
      return;
    }
    setStatusTarget({ kind: "Emergency Topic", label: topic.title, id, entity: "topic", nextStatus });
  }

  async function executeTopicStatusToggle() {
    if (!statusTarget) return;
    setActionBusy(true);
    const topic = topics.find((t) => t.id === statusTarget.id);
    if (!topic) { setActionBusy(false); setStatusTarget(null); return; }
    try {
      const res = await fetch(`${API_URL}/api/admin/emergency-cases/${statusTarget.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          petID: topic.petIds[0],
          topicTitle: topic.title,
          topicDesc: topic.description || topic.title,
          severity: topic.severity,
          keywords: topic.keywords,
          status: statusTarget.nextStatus,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        setActionBusy(false);
        setStatusTarget(null);
        addToast(d.message || "Failed to update topic status.", "error");
        return;
      }
      setTopics((prev) => prev.map((t) => t.id === statusTarget.id ? { ...t, status: statusTarget.nextStatus } : t));
      setActionBusy(false);
      setStatusTarget(null);
      addToast(`"${topic.title}" set to ${statusTarget.nextStatus}.`, "success");
    } catch {
      setActionBusy(false);
      setStatusTarget(null);
      addToast("Server error. Please try again.", "error");
    }
  }

  /* ── Helpers ─────────────────────────────────────────────── */
  function getPetNames(petIds = []) {
    const linkedPets = pets.filter((pet) => petIds.includes(pet.id));
    if (linkedPets.length === 0) return "No linked pet";
    return linkedPets.map((pet) => `${pet.emoji} ${pet.name}`).join(", ");
  }

  /* ── Consolidated confirm dispatcher ─────────────────────── */
  function handleConfirmDelete() {
    if (!deleteTarget) return;
    if (deleteTarget.entity === "pet") executeDeletePet();
    else executeDeleteTopic();
  }

  function handleConfirmStatus() {
    if (!statusTarget) return;
    if (statusTarget.entity === "pet") executePetStatusToggle();
    else executeTopicStatusToggle();
  }

  /* ── Render floating action menu ─────────────────────────── */
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
            <button onClick={() => handleTogglePetStatus(pet.id)}>
              {pet.status === "Active" ? "Set Inactive" : "Set Active"}
            </button>
            <button className="danger-text" onClick={() => handleDeletePet(pet.id)}>Delete</button>
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
            <button onClick={() => handleToggleTopicStatus(topic.id)}>
              {topic.status === "Published" ? "Set to Draft" : "Publish"}
            </button>
            <button className="danger-text" onClick={() => handleDeleteTopic(topic.id)}>Delete</button>
          </div>
        </>
      );
    }

    return null;
  }

  /* ── Render pet modal ────────────────────────────────────── */
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
              <input type="text" placeholder="Example: Dog" value={petForm.name}
                onChange={(e) => setPetForm({ ...petForm, name: e.target.value })} />
            </label>
            <label>
              Emoji
              <input type="text" placeholder="Example: 🐶" value={petForm.emoji}
                onChange={(e) => setPetForm({ ...petForm, emoji: e.target.value })} />
            </label>
            <label>
              Description
              <textarea rows="4" placeholder="Short description for this pet type" value={petForm.description}
                onChange={(e) => setPetForm({ ...petForm, description: e.target.value })} />
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

  /* ── Render topic modal ──────────────────────────────────── */
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
                    <input type="checkbox" checked={topicForm.petIds.includes(pet.id)}
                      onChange={() => handleTopicPetToggle(pet.id)} />
                    <span>{pet.emoji} {pet.name}{pet.status !== "Active" && <small> ({pet.status})</small>}</span>
                  </label>
                ))}
              </div>
              {topicForm.petIds.length > 0 && (
                <p className="selected-note">
                  Selected: {pets.filter((pet) => topicForm.petIds.includes(pet.id)).map((p) => p.name).join(", ")}
                </p>
              )}
            </div>
            <label>
              Emergency Topic Title
              <input type="text" placeholder="Example: Choking" value={topicForm.title}
                onChange={(e) => setTopicForm({ ...topicForm, title: e.target.value })} />
            </label>
            <label>
              Description
              <textarea rows="3" placeholder="Brief description of this emergency" value={topicForm.description}
                onChange={(e) => setTopicForm({ ...topicForm, description: e.target.value })} />
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
              <input type="text" placeholder="Example: choking, breathing, airway" value={topicForm.keywords}
                onChange={(e) => setTopicForm({ ...topicForm, keywords: e.target.value })} />
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

  /* ── Loading / error ─────────────────────────────────────── */
  if (loading) return <div className="admin-page"><p>Loading…</p></div>;
  if (error) return <div className="admin-page"><p style={{ color: "crimson" }}>{error}</p></div>;

  /* ── Main render ─────────────────────────────────────────── */
  return (
    <div className="admin-page">
      {/* Toast layer */}
      <ToastPortal toasts={toasts} />

      {/* Delete confirm modal */}
      {deleteTarget && (
        <ConfirmDeleteModal
          item={deleteTarget}
          onCancel={() => { if (!actionBusy) setDeleteTarget(null); }}
          onConfirm={handleConfirmDelete}
          busy={actionBusy}
        />
      )}

      {/* Status confirm modal */}
      {statusTarget && (
        <ConfirmStatusModal
          item={statusTarget}
          onCancel={() => { if (!actionBusy) setStatusTarget(null); }}
          onConfirm={handleConfirmStatus}
          busy={actionBusy}
        />
      )}

      {/* Result modal (success / error after form submit) */}
      {resultModal && (
        <ResultModal
          result={resultModal}
          onClose={() => setResultModal(null)}
        />
      )}

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
        <button className={activeTab === "pets" ? "active" : ""}
          onClick={() => { setActiveTab("pets"); closeActionMenu(); }}>Pet Types</button>
        <button className={activeTab === "topics" ? "active" : ""}
          onClick={() => { setActiveTab("topics"); closeActionMenu(); }}>Emergency Topics</button>
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
            <input type="text" placeholder="Search by title, keyword, or pet type..."
              value={searchKeyword} onChange={(e) => setSearchKeyword(e.target.value)} />
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