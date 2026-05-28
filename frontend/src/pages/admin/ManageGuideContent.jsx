import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import "../../styles/admin.css";
import "../../styles/manageGuideContent.css";
import "../../styles/mgcNotifications.css";

const API_URL = import.meta.env.VITE_API_URL;

// ─────────────────────────────────────────────────────────────
// Toast hook
// ─────────────────────────────────────────────────────────────
function useToast() {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const dismiss = useCallback((id) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, leaving: true } : t))
    );
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 350);
  }, []);

  const show = useCallback(
    (type, title, message) => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev, { id, type, title, message, leaving: false }]);
      timers.current[id] = setTimeout(() => dismiss(id), 4000);
      return id;
    },
    [dismiss]
  );

  const toast = useMemo(
    () => ({
      success: (title, msg) => show("success", title, msg),
      error: (title, msg) => show("error", title, msg),
      warning: (title, msg) => show("warning", title, msg),
      info: (title, msg) => show("info", title, msg),
    }),
    [show]
  );

  return { toasts, dismiss, toast };
}

// ─────────────────────────────────────────────────────────────
// Confirm dialog hook
// ─────────────────────────────────────────────────────────────
function useConfirm() {
  const [dialog, setDialog] = useState(null);
  const resolverRef = useRef(null);

  const confirm = useCallback(({ title, message, confirmLabel = "Confirm", cancelLabel = "Cancel", variant = "danger" }) => {
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setDialog({ title, message, confirmLabel, cancelLabel, variant });
    });
  }, []);

  function handleConfirm() {
    setDialog(null);
    resolverRef.current?.(true);
  }
  function handleCancel() {
    setDialog(null);
    resolverRef.current?.(false);
  }

  return { dialog, confirm, handleConfirm, handleCancel };
}

// ─────────────────────────────────────────────────────────────
// Toast renderer component
// ─────────────────────────────────────────────────────────────
const TOAST_ICONS = {
  success: "✓",
  error: "✕",
  warning: "⚠",
  info: "ℹ",
};

function ToastContainer({ toasts, dismiss }) {
  if (toasts.length === 0) return null;
  return (
    <div className="mgcn-toast-container" aria-live="polite">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`mgcn-toast mgcn-toast--${t.type}${t.leaving ? " mgcn-toast--leaving" : ""}`}
          role="alert"
        >
          <span className="mgcn-toast__icon">{TOAST_ICONS[t.type]}</span>
          <div className="mgcn-toast__body">
            <strong className="mgcn-toast__title">{t.title}</strong>
            {t.message && <p className="mgcn-toast__msg">{t.message}</p>}
          </div>
          <button
            className="mgcn-toast__close"
            onClick={() => dismiss(t.id)}
            aria-label="Dismiss"
          >
            ×
          </button>
          <span className="mgcn-toast__progress" />
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Confirm dialog component
// ─────────────────────────────────────────────────────────────
const CONFIRM_ICONS = {
  danger:  { emoji: "🗑️", bg: "#fff1ee", color: "#b6533f" },
  warning: { emoji: "⚠️", bg: "#fff7df", color: "#7a5a10" },
  info:    { emoji: "ℹ️", bg: "#e8f4fd", color: "#1a6fa8" },
};

function ConfirmDialog({ dialog, onConfirm, onCancel }) {
  if (!dialog) return null;
  const icon = CONFIRM_ICONS[dialog.variant] || CONFIRM_ICONS.danger;
  return (
    <div className="mgcn-confirm-overlay" onClick={onCancel}>
      <div
        className="mgcn-confirm-modal"
        onClick={(e) => e.stopPropagation()}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="mgcn-confirm-title"
      >
        <div
          className="mgcn-confirm-icon"
          style={{ background: icon.bg, color: icon.color }}
        >
          {icon.emoji}
        </div>
        <h2 id="mgcn-confirm-title" className="mgcn-confirm-title">
          {dialog.title}
        </h2>
        <p className="mgcn-confirm-msg">{dialog.message}</p>
        <div className="mgcn-confirm-actions">
          <button className="mgcn-confirm-cancel" onClick={onCancel}>
            {dialog.cancelLabel}
          </button>
          <button
            className={`mgcn-confirm-ok mgcn-confirm-ok--${dialog.variant}`}
            onClick={onConfirm}
          >
            {dialog.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main page component
// ─────────────────────────────────────────────────────────────
function ManageGuideContent() {
  const [activeTab, setActiveTab] = useState("guides");
  const [actionMenu, setActionMenu] = useState(null);
  const [modalType, setModalType] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [emergencyTopics, setEmergencyTopics] = useState([]);
  const [pets, setPets] = useState([]);
  const [guides, setGuides] = useState([]);
  const [mediaList, setMediaList] = useState([]);
  const [vetAdviceList, setVetAdviceList] = useState([]);

  const [guideForm, setGuideForm] = useState({ id: null, topicId: "", title: "", overview: "", steps: [], status: "Draft" });
  const [stepForm, setStepForm] = useState({ index: null, instruction: "" });
  const [mediaForm, setMediaForm] = useState({ id: null, guideId: "", type: "Image", title: "", url: "", caption: "", status: "Draft" });
  const [adviceForm, setAdviceForm] = useState({ id: null, guideId: "", advice: "", urgency: "General", status: "Draft" });
  const [viewGuide, setViewGuide] = useState(null);

  const [guideSearch, setGuideSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [petFilter, setPetFilter] = useState("All");

  const token = localStorage.getItem("token");

  // Notification hooks
  const { toasts, dismiss, toast } = useToast();
  const { dialog, confirm, handleConfirm, handleCancel } = useConfirm();

  // ── Fetch all data ─────────────────────────────────────────
  useEffect(() => {
    async function fetchAll() {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const urls = [
          `${API_URL}/api/admin/emergency-cases`,
          `${API_URL}/api/admin/pets`,
          `${API_URL}/api/admin/guides`,
          `${API_URL}/api/admin/media`,
          `${API_URL}/api/admin/vet-advice`,
        ];
        const responses = await Promise.all(urls.map((url) => fetch(url, { headers })));
        for (let i = 0; i < responses.length; i++) {
          if (!responses[i].ok) {
            throw new Error(`Route not found: ${urls[i]} (${responses[i].status})`);
          }
        }
        const [t, p, g, m, a] = await Promise.all(responses.map((r) => r.json()));
        setEmergencyTopics((t.cases || []).map((c) => ({ id: c.emergencyID, title: c.topicTitle, petID: c.petID, severity: c.severity, status: c.status })));
        setPets((p.pets || []).map((pt) => ({ id: pt.petID, name: pt.petName, emoji: pt.icon || "🐾", status: pt.status })));
        setGuides((g.guides || []).map((gd) => ({
          id: gd.guideID,
          topicId: gd.emergencyID,
          topicTitle: gd.topicTitle,
          title: gd.guideTitle,
          overview: gd.overview || "",
          steps: (() => { try { return JSON.parse(gd.steps || "[]"); } catch { return []; } })(),
          status: gd.status,
        })));
        setMediaList((m.media || []).map((md) => ({
          id: md.mediaID, guideId: md.guideID, guideTitle: md.guideTitle,
          type: md.media_type === "video" ? "Video" : "Image",
          title: md.mediaTitle, url: md.mediaURL, caption: md.caption || "", status: md.mediaStatus,
        })));
        setVetAdviceList((a.advice || []).map((av) => ({
          id: av.adviceID, guideId: av.guideID, guideTitle: av.guideTitle,
          advice: av.advice_text, urgency: av.urgency, status: av.adviceStatus,
        })));
      } catch (err) {
        setError("Failed to load data. " + err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, []);

  // ── Helpers ────────────────────────────────────────────────
  const filteredGuides = useMemo(() => {
    return guides.filter((guide) => {
      const keyword = guideSearch.toLowerCase();
      const matchesSearch =
        guide.title.toLowerCase().includes(keyword) ||
        guide.overview.toLowerCase().includes(keyword) ||
        guide.topicTitle?.toLowerCase().includes(keyword);
      const matchesStatus = statusFilter === "All" || guide.status === statusFilter;
      const topic = emergencyTopics.find((t) => t.id === guide.topicId);
      const matchesPet = petFilter === "All" || (topic && topic.petID === Number(petFilter));
      return matchesSearch && matchesStatus && matchesPet;
    });
  }, [guides, guideSearch, statusFilter, petFilter, emergencyTopics]);

  function getGuideById(guideId) { return guides.find((g) => g.id === Number(guideId)); }
  function getMediaSummary(guideId) {
    const active = mediaList.filter((m) => m.guideId === guideId);
    const img = active.filter((m) => m.type === "Image").length;
    const vid = active.filter((m) => m.type === "Video").length;
    if (img === 0 && vid === 0) return "No media";
    return `${img} image${img !== 1 ? "s" : ""}, ${vid} video${vid !== 1 ? "s" : ""}`;
  }
  function getPetNameForTopic(topicId) {
    const topic = emergencyTopics.find((t) => t.id === Number(topicId));
    if (!topic) return "—";
    const pet = pets.find((p) => p.id === topic.petID);
    return pet ? `${pet.emoji} ${pet.name}` : "—";
  }

  // ── Action menu ────────────────────────────────────────────
  function openActionMenu(event, type, id) {
    const rect = event.currentTarget.getBoundingClientRect();
    const menuWidth = 180; const gap = 10;
    const hasSpaceRight = window.innerWidth - rect.right > menuWidth + gap;
    const left = hasSpaceRight ? rect.right + gap : Math.max(12, rect.left - menuWidth - gap);
    const top = Math.min(rect.top, window.innerHeight - 250);
    setActionMenu({ type, id, left, top });
  }
  function closeActionMenu() { setActionMenu(null); }
  function closeModal() { setModalType(null); }

  // ── Guide modal ────────────────────────────────────────────
  function openAddGuideModal() {
    closeActionMenu();
    setGuideForm({ id: null, topicId: "", title: "", overview: "", steps: [], status: "Draft" });
    setStepForm({ index: null, instruction: "" });
    setModalType("guide");
  }
  function openEditGuideModal(guide) {
    closeActionMenu();
    setGuideForm({ id: guide.id, topicId: guide.topicId, title: guide.title, overview: guide.overview, steps: guide.steps || [], status: guide.status });
    setStepForm({ index: null, instruction: "" });
    setModalType("guide");
  }

  // ── Guide CRUD ─────────────────────────────────────────────
  async function handleGuideSubmit(event) {
    event.preventDefault();
    if (!guideForm.topicId) { toast.warning("Missing field", "Please select an emergency topic."); return; }
    if (!guideForm.title.trim()) { toast.warning("Missing field", "Please enter the guide title."); return; }
    if (guideForm.status === "Published" && guideForm.steps.length === 0) {
      toast.warning("Cannot publish", "A guide must have at least one step before publishing."); return;
    }
    const body = {
      emergencyID: guideForm.topicId,
      guideTitle: guideForm.title,
      overview: guideForm.overview,
      steps: guideForm.steps,
      status: guideForm.status,
    };
    try {
      if (guideForm.id) {
        const res = await fetch(`${API_URL}/api/admin/guides/${guideForm.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(body),
        });
        if (!res.ok) { const d = await res.json(); toast.error("Update failed", d.message || "Failed to update guide."); return; }
        setGuides((prev) => prev.map((g) => g.id === guideForm.id ? { ...g, topicId: Number(guideForm.topicId), title: guideForm.title, overview: guideForm.overview, steps: guideForm.steps, status: guideForm.status } : g));
        toast.success("Guide updated", `"${guideForm.title}" has been saved successfully.`);
      } else {
        const res = await fetch(`${API_URL}/api/admin/guides`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(body),
        });
        if (!res.ok) { const d = await res.json(); toast.error("Create failed", d.message || "Failed to create guide."); return; }
        const d = await res.json();
        const topic = emergencyTopics.find((t) => t.id === Number(guideForm.topicId));
        setGuides((prev) => [...prev, { id: d.guideID, topicId: Number(guideForm.topicId), topicTitle: topic?.title || "", title: guideForm.title, overview: guideForm.overview, steps: guideForm.steps, status: guideForm.status }]);
        toast.success("Guide created", `"${guideForm.title}" has been added successfully.`);
      }
      closeModal();
    } catch { toast.error("Server error", "Something went wrong. Please try again."); }
  }

  async function handleToggleGuideStatus(id) {
    const guide = guides.find((g) => g.id === id);
    if (!guide) return;
    if (guide.status === "Draft" && guide.steps.length === 0) {
      toast.warning("Cannot publish", "A guide must have at least one step before publishing.");
      closeActionMenu();
      return;
    }
    const newStatus = guide.status === "Published" ? "Draft" : "Published";
    try {
      const res = await fetch(`${API_URL}/api/admin/guides/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ emergencyID: guide.topicId, guideTitle: guide.title, overview: guide.overview, steps: guide.steps, status: newStatus }),
      });
      if (!res.ok) { const d = await res.json(); toast.error("Update failed", d.message || "Failed to update guide."); return; }
      setGuides((prev) => prev.map((g) => g.id === id ? { ...g, status: newStatus } : g));
      toast.success(
        newStatus === "Published" ? "Guide published" : "Moved to draft",
        `"${guide.title}" is now ${newStatus === "Published" ? "live" : "in draft"}.`
      );
    } catch { toast.error("Server error", "Something went wrong."); }
  }

  async function handleDeleteGuide(id) {
    closeActionMenu();
    const guide = guides.find((g) => g.id === id);
    const confirmed = await confirm({
      title: "Delete Guide",
      message: `Permanently delete "${guide?.title}"? All steps will also be removed. This cannot be undone.`,
      confirmLabel: "Yes, Delete",
      cancelLabel: "Cancel",
      variant: "danger",
    });
    if (!confirmed) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/guides/${id}`, {
        method: "DELETE", headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) { const d = await res.json(); toast.error("Delete failed", d.message || "Failed to delete guide."); return; }
      setGuides((prev) => prev.filter((g) => g.id !== id));
      toast.success("Guide deleted", `"${guide?.title}" has been permanently removed.`);
    } catch { toast.error("Server error", "Something went wrong."); }
  }

  // ── Steps ──────────────────────────────────────────────────
  function handleAddStep() {
    if (!stepForm.instruction.trim()) { toast.warning("Missing instruction", "Please enter the step instruction."); return; }
    const updated = [...guideForm.steps, stepForm.instruction.trim()];
    setGuideForm((prev) => ({ ...prev, steps: updated }));
    setStepForm({ index: null, instruction: "" });
    toast.success("Step added", `Step ${updated.length} has been added.`);
  }
  function handleEditStep(index) {
    setStepForm({ index, instruction: guideForm.steps[index] });
  }
  function handleSaveStep() {
    if (!stepForm.instruction.trim()) { toast.warning("Missing instruction", "Please enter the step instruction."); return; }
    const updated = guideForm.steps.map((s, i) => i === stepForm.index ? stepForm.instruction.trim() : s);
    setGuideForm((prev) => ({ ...prev, steps: updated }));
    setStepForm({ index: null, instruction: "" });
    toast.success("Step updated", `Step ${stepForm.index + 1} has been saved.`);
  }
  function handleDeleteStep(index) {
    const updated = guideForm.steps.filter((_, i) => i !== index);
    setGuideForm((prev) => ({ ...prev, steps: updated }));
    if (stepForm.index === index) setStepForm({ index: null, instruction: "" });
    toast.info("Step removed", `Step ${index + 1} has been removed.`);
  }

  // ── Media CRUD ─────────────────────────────────────────────
  function openAddMediaModal() { closeActionMenu(); setMediaForm({ id: null, guideId: "", type: "Image", title: "", url: "", caption: "", status: "Draft" }); setModalType("media"); }
  function openEditMediaModal(media) { closeActionMenu(); setMediaForm({ id: media.id, guideId: media.guideId, type: media.type, title: media.title, url: media.url, caption: media.caption, status: media.status }); setModalType("media"); }

  async function handleMediaSubmit(event) {
    event.preventDefault();
    if (!mediaForm.guideId) { toast.warning("Missing field", "Please select a guide."); return; }
    if (!mediaForm.title.trim()) { toast.warning("Missing field", "Please enter the media title."); return; }
    if (!mediaForm.url.trim()) { toast.warning("Missing field", "Please enter the media URL."); return; }
    const body = { guideID: mediaForm.guideId, media_type: mediaForm.type.toLowerCase(), mediaTitle: mediaForm.title, caption: mediaForm.caption, mediaURL: mediaForm.url, mediaStatus: mediaForm.status };
    try {
      if (mediaForm.id) {
        const res = await fetch(`${API_URL}/api/admin/media/${mediaForm.id}`, { method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(body) });
        if (!res.ok) { const d = await res.json(); toast.error("Update failed", d.message || "Failed to update media."); return; }
        setMediaList((prev) => prev.map((m) => m.id === mediaForm.id ? { ...m, guideId: Number(mediaForm.guideId), type: mediaForm.type, title: mediaForm.title, url: mediaForm.url, caption: mediaForm.caption, status: mediaForm.status } : m));
        toast.success("Media updated", `"${mediaForm.title}" has been saved.`);
      } else {
        const res = await fetch(`${API_URL}/api/admin/media`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(body) });
        if (!res.ok) { const d = await res.json(); toast.error("Create failed", d.message || "Failed to create media."); return; }
        const d = await res.json();
        const guide = getGuideById(mediaForm.guideId);
        setMediaList((prev) => [...prev, { id: d.mediaID, guideId: Number(mediaForm.guideId), guideTitle: guide?.title || "", type: mediaForm.type, title: mediaForm.title, url: mediaForm.url, caption: mediaForm.caption, status: mediaForm.status }]);
        toast.success("Media added", `"${mediaForm.title}" has been added successfully.`);
      }
      closeModal();
    } catch { toast.error("Server error", "Something went wrong."); }
  }

  async function handleDeleteMedia(id) {
    closeActionMenu();
    const media = mediaList.find((m) => m.id === id);
    const confirmed = await confirm({
      title: "Delete Media",
      message: `Permanently delete "${media?.title}"? This cannot be undone.`,
      confirmLabel: "Yes, Delete",
      cancelLabel: "Cancel",
      variant: "danger",
    });
    if (!confirmed) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/media/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) { const d = await res.json(); toast.error("Delete failed", d.message || "Failed to delete media."); return; }
      setMediaList((prev) => prev.filter((m) => m.id !== id));
      toast.success("Media deleted", `"${media?.title}" has been removed.`);
    } catch { toast.error("Server error", "Something went wrong."); }
  }

  async function handleToggleMediaStatus(id) {
    const media = mediaList.find((m) => m.id === id);
    if (!media) return;
    const newStatus = media.status === "Published" ? "Draft" : "Published";
    try {
      const res = await fetch(`${API_URL}/api/admin/media/${id}`, { method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ guideID: media.guideId, media_type: media.type.toLowerCase(), mediaTitle: media.title, caption: media.caption, mediaURL: media.url, mediaStatus: newStatus }) });
      if (!res.ok) { const d = await res.json(); toast.error("Update failed", d.message || "Failed to update media."); return; }
      setMediaList((prev) => prev.map((m) => m.id === id ? { ...m, status: newStatus } : m));
      toast.success(
        newStatus === "Published" ? "Media published" : "Moved to draft",
        `"${media.title}" is now ${newStatus === "Published" ? "live" : "in draft"}.`
      );
    } catch { toast.error("Server error", "Something went wrong."); }
  }

  // ── Vet Advice CRUD ────────────────────────────────────────
  function openAddAdviceModal() { closeActionMenu(); setAdviceForm({ id: null, guideId: "", advice: "", urgency: "General", status: "Draft" }); setModalType("advice"); }
  function openEditAdviceModal(advice) { closeActionMenu(); setAdviceForm({ id: advice.id, guideId: advice.guideId, advice: advice.advice, urgency: advice.urgency, status: advice.status }); setModalType("advice"); }

  async function handleAdviceSubmit(event) {
    event.preventDefault();
    if (!adviceForm.guideId) { toast.warning("Missing field", "Please select a guide."); return; }
    if (!adviceForm.advice.trim()) { toast.warning("Missing field", "Please enter veterinary advice."); return; }
    const body = { guideID: adviceForm.guideId, advice_text: adviceForm.advice, urgency: adviceForm.urgency, adviceStatus: adviceForm.status };
    try {
      if (adviceForm.id) {
        const res = await fetch(`${API_URL}/api/admin/vet-advice/${adviceForm.id}`, { method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(body) });
        if (!res.ok) { const d = await res.json(); toast.error("Update failed", d.message || "Failed to update advice."); return; }
        setVetAdviceList((prev) => prev.map((a) => a.id === adviceForm.id ? { ...a, guideId: Number(adviceForm.guideId), advice: adviceForm.advice, urgency: adviceForm.urgency, status: adviceForm.status } : a));
        toast.success("Advice updated", "Veterinary advice has been saved successfully.");
      } else {
        const res = await fetch(`${API_URL}/api/admin/vet-advice`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(body) });
        if (!res.ok) { const d = await res.json(); toast.error("Create failed", d.message || "Failed to create advice."); return; }
        const d = await res.json();
        const guide = getGuideById(adviceForm.guideId);
        setVetAdviceList((prev) => [...prev, { id: d.adviceID, guideId: Number(adviceForm.guideId), guideTitle: guide?.title || "", advice: adviceForm.advice, urgency: adviceForm.urgency, status: adviceForm.status }]);
        toast.success("Advice added", "New veterinary advice has been created.");
      }
      closeModal();
    } catch { toast.error("Server error", "Something went wrong."); }
  }

  async function handleDeleteAdvice(id) {
    closeActionMenu();
    const confirmed = await confirm({
      title: "Delete Vet Advice",
      message: "Permanently delete this veterinary advice? This cannot be undone.",
      confirmLabel: "Yes, Delete",
      cancelLabel: "Cancel",
      variant: "danger",
    });
    if (!confirmed) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/vet-advice/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) { const d = await res.json(); toast.error("Delete failed", d.message || "Failed to delete advice."); return; }
      setVetAdviceList((prev) => prev.filter((a) => a.id !== id));
      toast.success("Advice deleted", "Veterinary advice has been removed.");
    } catch { toast.error("Server error", "Something went wrong."); }
  }

  async function handleToggleAdviceStatus(id) {
    const advice = vetAdviceList.find((a) => a.id === id);
    if (!advice) return;
    const newStatus = advice.status === "Published" ? "Draft" : "Published";
    try {
      const res = await fetch(`${API_URL}/api/admin/vet-advice/${id}`, { method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ guideID: advice.guideId, advice_text: advice.advice, urgency: advice.urgency, adviceStatus: newStatus }) });
      if (!res.ok) { const d = await res.json(); toast.error("Update failed", d.message || "Failed to update advice."); return; }
      setVetAdviceList((prev) => prev.map((a) => a.id === id ? { ...a, status: newStatus } : a));
      toast.success(
        newStatus === "Published" ? "Advice published" : "Moved to draft",
        `Advice is now ${newStatus === "Published" ? "live" : "in draft"}.`
      );
    } catch { toast.error("Server error", "Something went wrong."); }
  }

  // ── Floating action menu ───────────────────────────────────
  function renderFloatingActionMenu() {
    if (!actionMenu) return null;

    if (actionMenu.type === "guide") {
      const guide = guides.find((g) => g.id === actionMenu.id);
      if (!guide) return null;
      return (
        <>
          <div className="floating-menu-backdrop" onClick={closeActionMenu} />
          <div className="floating-action-menu" style={{ left: `${actionMenu.left}px`, top: `${actionMenu.top}px` }}>
            <button onClick={() => { setViewGuide(guide); closeActionMenu(); }}>View Details</button>
            <button onClick={() => openEditGuideModal(guide)}>Edit Guide</button>
            <button onClick={() => { handleToggleGuideStatus(guide.id); closeActionMenu(); }}>
              {guide.status === "Published" ? "Move to Draft" : "Publish"}
            </button>
            <button className="danger-text" onClick={() => handleDeleteGuide(guide.id)}>Delete</button>
          </div>
        </>
      );
    }

    if (actionMenu.type === "media") {
      const media = mediaList.find((m) => m.id === actionMenu.id);
      if (!media) return null;
      return (
        <>
          <div className="floating-menu-backdrop" onClick={closeActionMenu} />
          <div className="floating-action-menu" style={{ left: `${actionMenu.left}px`, top: `${actionMenu.top}px` }}>
            <button onClick={() => openEditMediaModal(media)}>Edit Media</button>
            <button onClick={() => { handleToggleMediaStatus(media.id); closeActionMenu(); }}>
              {media.status === "Published" ? "Move to Draft" : "Publish"}
            </button>
            <button className="danger-text" onClick={() => handleDeleteMedia(media.id)}>Delete</button>
          </div>
        </>
      );
    }

    if (actionMenu.type === "advice") {
      const advice = vetAdviceList.find((a) => a.id === actionMenu.id);
      if (!advice) return null;
      return (
        <>
          <div className="floating-menu-backdrop" onClick={closeActionMenu} />
          <div className="floating-action-menu" style={{ left: `${actionMenu.left}px`, top: `${actionMenu.top}px` }}>
            <button onClick={() => openEditAdviceModal(advice)}>Edit Advice</button>
            <button onClick={() => { handleToggleAdviceStatus(advice.id); closeActionMenu(); }}>
              {advice.status === "Published" ? "Move to Draft" : "Publish"}
            </button>
            <button className="danger-text" onClick={() => handleDeleteAdvice(advice.id)}>Delete</button>
          </div>
        </>
      );
    }

    return null;
  }

  // ── View Details modal ─────────────────────────────────────
  function renderViewDetailsModal() {
    if (!viewGuide) return null;
    const steps = viewGuide.steps || [];
    return (
      <div className="modal-backdrop" onClick={() => setViewGuide(null)}>
        <section className="admin-modal mgc-large-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <div>
              <p className="page-subtitle">{viewGuide.topicTitle}</p>
              <h2>{viewGuide.title}</h2>
            </div>
            <button className="modal-close-btn" onClick={() => setViewGuide(null)}>×</button>
          </div>

          {viewGuide.overview && (
            <p style={{ marginBottom: "1.5rem", color: "var(--text-secondary, #666)" }}>{viewGuide.overview}</p>
          )}

          <div className="admin-form-group">
            <p className="admin-form-label">First-Aid Steps</p>
            {steps.length === 0 ? (
              <p className="empty-table-text">No steps added yet.</p>
            ) : (
              <div className="mgc-step-list">
                {steps.map((step, i) => (
                  <div key={i} className="mgc-step-card">
                    <div className="mgc-step-info">
                      <strong className="mgc-step-title">Step {i + 1}</strong>
                      <p className="mgc-step-text">{step}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="form-actions" style={{ marginTop: "1.5rem" }}>
            <button className="secondary-btn" onClick={() => setViewGuide(null)}>Close</button>
            <button className="primary-btn" onClick={() => { openEditGuideModal(viewGuide); setViewGuide(null); }}>Edit Guide</button>
          </div>
        </section>
      </div>
    );
  }

  // ── Guide modal ────────────────────────────────────────────
  function renderGuideModal() {
    if (modalType !== "guide") return null;
    return (
      <div className="modal-backdrop" onClick={closeModal}>
        <section className="admin-modal mgc-large-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <div><p className="page-subtitle">Guide Content</p><h2>{guideForm.id ? "Edit Guide" : "Add Guide"}</h2></div>
            <button className="modal-close-btn" onClick={closeModal}>×</button>
          </div>
          <form onSubmit={handleGuideSubmit} className="admin-form">
            <label>
              Emergency Topic
              <select value={guideForm.topicId} onChange={(e) => setGuideForm({ ...guideForm, topicId: e.target.value })}>
                <option value="">Select emergency topic</option>
                {emergencyTopics.filter((t) => t.status === "Published").map((t) => (
                  <option key={t.id} value={t.id}>{t.title}</option>
                ))}
              </select>
            </label>
            <label>
              Guide Title
              <input type="text" placeholder="Example: Dog Choking First Aid" value={guideForm.title} onChange={(e) => setGuideForm({ ...guideForm, title: e.target.value })} />
            </label>
            <label>
              Overview
              <textarea rows="3" placeholder="Short overview of this guide" value={guideForm.overview} onChange={(e) => setGuideForm({ ...guideForm, overview: e.target.value })} />
            </label>
            <label>
              Status
              <select value={guideForm.status} onChange={(e) => setGuideForm({ ...guideForm, status: e.target.value })}>
                <option value="Draft">Draft</option>
                <option value="Published">Published</option>
              </select>
            </label>

            {/* Inline steps editor */}
            <div className="admin-form-group">
              <p className="admin-form-label">First-Aid Steps</p>
              <div className="mgc-step-list">
                {guideForm.steps.length === 0 && <p className="empty-table-text">No steps added yet.</p>}
                {guideForm.steps.map((step, i) => (
                  <div key={i} className="mgc-step-card">
                    <div className="mgc-step-info">
                      <strong className="mgc-step-title">Step {i + 1}</strong>
                      <p className="mgc-step-text">{step}</p>
                    </div>
                    <div className="mgc-step-buttons">
                      <button type="button" className="mgc-step-btn" onClick={() => handleEditStep(i)}>Edit</button>
                      <button type="button" className="mgc-step-btn mgc-step-btn-archive" onClick={() => handleDeleteStep(i)}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mgc-step-form">
                <label>
                  {stepForm.index !== null ? `Edit Step ${stepForm.index + 1}` : "New Step"}
                  <textarea rows="2" placeholder="Enter the first-aid instruction" value={stepForm.instruction} onChange={(e) => setStepForm({ ...stepForm, instruction: e.target.value })} />
                </label>
                <div className="form-actions">
                  {stepForm.index !== null ? (
                    <>
                      <button type="button" className="primary-btn" onClick={handleSaveStep}>Save Step</button>
                      <button type="button" className="secondary-btn" onClick={() => setStepForm({ index: null, instruction: "" })}>Cancel</button>
                    </>
                  ) : (
                    <button type="button" className="secondary-btn" onClick={handleAddStep}>+ Add Step</button>
                  )}
                </div>
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="primary-btn">{guideForm.id ? "Save Changes" : "+ Add Guide"}</button>
              <button type="button" className="secondary-btn" onClick={closeModal}>Cancel</button>
            </div>
          </form>
        </section>
      </div>
    );
  }

  // ── Media modal ────────────────────────────────────────────
  function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const maxSize = 500 * 1024;
    if (file.size > maxSize) {
      toast.warning("File too large", "Please upload an image smaller than 500KB.");
      e.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setMediaForm((prev) => ({ ...prev, url: reader.result }));
    reader.readAsDataURL(file);
  }

  function renderMediaModal() {
    if (modalType !== "media") return null;
    const isImage = mediaForm.type === "Image";
    return (
      <div className="modal-backdrop" onClick={closeModal}>
        <section className="admin-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <div><p className="page-subtitle">Multimedia</p><h2>{mediaForm.id ? "Edit Media" : "Add Media"}</h2></div>
            <button className="modal-close-btn" onClick={closeModal}>×</button>
          </div>
          <form onSubmit={handleMediaSubmit} className="admin-form">
            <label>
              Guide
              <select value={mediaForm.guideId} onChange={(e) => setMediaForm({ ...mediaForm, guideId: e.target.value })}>
                <option value="">Select guide</option>
                {guides.map((g) => (<option key={g.id} value={g.id}>{g.title}</option>))}
              </select>
            </label>
            <label>
              Media Type
              <select value={mediaForm.type} onChange={(e) => setMediaForm({ ...mediaForm, type: e.target.value, url: "" })}>
                <option value="Image">Image</option>
                <option value="Video">Video</option>
              </select>
            </label>
            <label>
              Media Title
              <input type="text" placeholder="Example: Choking first-aid demonstration" value={mediaForm.title} onChange={(e) => setMediaForm({ ...mediaForm, title: e.target.value })} />
            </label>

            {isImage ? (
              <label>
                Upload Image
                <input type="file" accept="image/*" onChange={handleImageUpload} style={{ padding: "8px 0" }} />
                {mediaForm.url && mediaForm.url.startsWith("data:") && (
                  <img
                    src={mediaForm.url}
                    alt="preview"
                    style={{ marginTop: 10, width: "100%", maxHeight: 260, objectFit: "contain", borderRadius: 8, background: "#f6f6f6", display: "block" }}
                  />
                )}
                {mediaForm.url && !mediaForm.url.startsWith("data:") && (
                  <p className="form-note" style={{ marginTop: 6 }}>Current: <a href={mediaForm.url} target="_blank" rel="noreferrer">View image</a></p>
                )}
              </label>
            ) : (
              <label>
                Video URL
                <input type="text" placeholder="https://example.com/video" value={mediaForm.url} onChange={(e) => setMediaForm({ ...mediaForm, url: e.target.value })} />
              </label>
            )}

            <label>
              Caption
              <textarea rows="3" placeholder="Short description for this media" value={mediaForm.caption} onChange={(e) => setMediaForm({ ...mediaForm, caption: e.target.value })} />
            </label>
            <label>
              Status
              <select value={mediaForm.status} onChange={(e) => setMediaForm({ ...mediaForm, status: e.target.value })}>
                <option value="Draft">Draft</option>
                <option value="Published">Published</option>
              </select>
            </label>
            <div className="form-actions">
              <button type="submit" className="primary-btn">{mediaForm.id ? "Save Changes" : "+ Add Media"}</button>
              <button type="button" className="secondary-btn" onClick={closeModal}>Cancel</button>
            </div>
          </form>
        </section>
      </div>
    );
  }

  // ── Advice modal ───────────────────────────────────────────
  function renderAdviceModal() {
    if (modalType !== "advice") return null;
    return (
      <div className="modal-backdrop" onClick={closeModal}>
        <section className="admin-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <div><p className="page-subtitle">Veterinary Advice</p><h2>{adviceForm.id ? "Edit Vet Advice" : "Add Vet Advice"}</h2></div>
            <button className="modal-close-btn" onClick={closeModal}>×</button>
          </div>
          <form onSubmit={handleAdviceSubmit} className="admin-form">
            <label>
              Guide
              <select value={adviceForm.guideId} onChange={(e) => setAdviceForm({ ...adviceForm, guideId: e.target.value })}>
                <option value="">Select guide</option>
                {guides.map((g) => (<option key={g.id} value={g.id}>{g.title}</option>))}
              </select>
            </label>
            <label>
              Advice
              <textarea rows="5" placeholder="Enter veterinary advice" value={adviceForm.advice} onChange={(e) => setAdviceForm({ ...adviceForm, advice: e.target.value })} />
            </label>
            <label>
              Urgency
              <select value={adviceForm.urgency} onChange={(e) => setAdviceForm({ ...adviceForm, urgency: e.target.value })}>
                <option value="General">General</option>
                <option value="Urgent">Urgent</option>
                <option value="Emergency">Emergency</option>
              </select>
            </label>
            <label>
              Status
              <select value={adviceForm.status} onChange={(e) => setAdviceForm({ ...adviceForm, status: e.target.value })}>
                <option value="Draft">Draft</option>
                <option value="Published">Published</option>
              </select>
            </label>
            <div className="form-actions">
              <button type="submit" className="primary-btn">{adviceForm.id ? "Save Changes" : "+ Add Advice"}</button>
              <button type="button" className="secondary-btn" onClick={closeModal}>Cancel</button>
            </div>
          </form>
        </section>
      </div>
    );
  }

  // ── Main render ────────────────────────────────────────────
  if (loading) return <div className="admin-page"><p>Loading…</p></div>;
  if (error) return <div className="admin-page"><p style={{ color: "crimson" }}>{error}</p></div>;

  return (
    <div className="admin-page manage-guide-page">
      {/* Notification layers */}
      <ToastContainer toasts={toasts} dismiss={dismiss} />
      <ConfirmDialog dialog={dialog} onConfirm={handleConfirm} onCancel={handleCancel} />

      {renderFloatingActionMenu()}
      {renderGuideModal()}
      {renderViewDetailsModal()}
      {renderMediaModal()}
      {renderAdviceModal()}

      <div className="page-title-row">
        <div className="page-title-area">
          <p className="page-subtitle">Admin Management</p>
          <h1>Manage Guide Content</h1>
        </div>
      </div>

      <div className="admin-tabs">
        <button className={activeTab === "guides" ? "active" : ""} onClick={() => { setActiveTab("guides"); closeActionMenu(); }}>Guides & Steps</button>
        <button className={activeTab === "media" ? "active" : ""} onClick={() => { setActiveTab("media"); closeActionMenu(); }}>Multimedia</button>
        <button className={activeTab === "advice" ? "active" : ""} onClick={() => { setActiveTab("advice"); closeActionMenu(); }}>Vet Advice</button>
      </div>

      {/* ── Guides tab ── */}
      {activeTab === "guides" && (
        <section className="admin-table-card">
          <div className="table-header-row">
            <div>
              <h2>First-Aid Guide List</h2>
              <p className="form-note">Steps are managed inside each guide's Edit modal. A guide needs at least one step before publishing.</p>
            </div>
            <button className="primary-btn table-add-btn" onClick={openAddGuideModal}>+ Add Guide</button>
          </div>
          <div className="filter-row guide-filter-row">
            <input type="text" placeholder="Search by guide title or pet type..." value={guideSearch} onChange={(e) => setGuideSearch(e.target.value)} />
            <select value={petFilter} onChange={(e) => setPetFilter(e.target.value)}>
              <option value="All">All Pet Types</option>
              {pets.map((p) => (<option key={p.id} value={p.id}>{p.emoji} {p.name}</option>))}
            </select>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="All">All Status</option>
              <option value="Published">Published</option>
              <option value="Draft">Draft</option>
            </select>
          </div>
          <p className="table-scroll-note">Scroll sideways to view more columns on smaller screens.</p>
          <div className="table-responsive">
            <table className="admin-table guide-table">
              <thead>
                <tr><th>Guide Title</th><th>Emergency Topic</th><th>Pet Type</th><th>Media</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {filteredGuides.length > 0 ? filteredGuides.map((guide) => (
                  <tr key={guide.id}>
                    <td><strong className="cell-title">{guide.title}</strong><p className="table-small-text">{guide.overview}</p></td>
                    <td>{guide.topicTitle}</td>
                    <td><span className="long-table-text">{getPetNameForTopic(guide.topicId)}</span></td>
                    <td><span className="long-table-text">{getMediaSummary(guide.id)}</span></td>
                    <td><span className={guide.status === "Published" ? "status-badge" : "status-badge draft"}>{guide.status}</span></td>
                    <td><button className="three-dot-btn" onClick={(e) => openActionMenu(e, "guide", guide.id)}>⋯</button></td>
                  </tr>
                )) : (
                  <tr><td colSpan="6" className="empty-table-text">No guides found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ── Media tab ── */}
      {activeTab === "media" && (
        <section className="admin-table-card">
          <div className="table-header-row">
            <div><h2>Multimedia List</h2><p className="form-note">Manage images and videos that support first-aid guides.</p></div>
            <button className="primary-btn table-add-btn" onClick={openAddMediaModal}>+ Add Media</button>
          </div>
          <p className="table-scroll-note">Scroll sideways to view more columns on smaller screens.</p>
          <div className="table-responsive">
            <table className="admin-table media-table">
              <thead>
                <tr><th>Media Title</th><th>Guide</th><th>Type</th><th>Caption</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {mediaList.length > 0 ? mediaList.map((media) => (
                  <tr key={media.id}>
                    <td><strong className="cell-title">{media.title}</strong></td>
                    <td>{media.guideTitle}</td>
                    <td>{media.type}</td>
                    <td><span className="long-table-text">{media.caption}</span></td>
                    <td><span className={media.status === "Published" ? "status-badge" : "status-badge draft"}>{media.status}</span></td>
                    <td><button className="three-dot-btn" onClick={(e) => openActionMenu(e, "media", media.id)}>⋯</button></td>
                  </tr>
                )) : (
                  <tr><td colSpan="6" className="empty-table-text">No media found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ── Vet Advice tab ── */}
      {activeTab === "advice" && (
        <section className="admin-table-card">
          <div className="table-header-row">
            <div><h2>Veterinary Advice List</h2><p className="form-note">Manage advice shown under each first-aid guide.</p></div>
            <button className="primary-btn table-add-btn" onClick={openAddAdviceModal}>+ Add Vet Advice</button>
          </div>
          <p className="table-scroll-note">Scroll sideways to view more columns on smaller screens.</p>
          <div className="table-responsive">
            <table className="admin-table advice-table">
              <thead>
                <tr><th>Advice</th><th>Guide</th><th>Urgency</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {vetAdviceList.length > 0 ? vetAdviceList.map((advice) => (
                  <tr key={advice.id}>
                    <td><span className="long-table-text">{advice.advice}</span></td>
                    <td>{advice.guideTitle}</td>
                    <td><span className={`severity-badge ${advice.urgency.toLowerCase()}`}>{advice.urgency}</span></td>
                    <td><span className={advice.status === "Published" ? "status-badge" : "status-badge draft"}>{advice.status}</span></td>
                    <td><button className="three-dot-btn" onClick={(e) => openActionMenu(e, "advice", advice.id)}>⋯</button></td>
                  </tr>
                )) : (
                  <tr><td colSpan="5" className="empty-table-text">No vet advice found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

export default ManageGuideContent;