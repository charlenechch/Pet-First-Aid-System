import { useMemo, useState } from "react";
import "../../styles/admin.css";
import "../../styles/manageGuideContent.css";

function ManageGuideContent() {
  const [activeTab, setActiveTab] = useState("guides");
  const [actionMenu, setActionMenu] = useState(null);
  const [modalType, setModalType] = useState(null);
  const [selectedGuideId, setSelectedGuideId] = useState(null);

  const pets = [
    { id: 1, name: "Dog", emoji: "🐶", status: "Active" },
    { id: 2, name: "Cat", emoji: "🐱", status: "Active" },
    { id: 3, name: "Rabbit", emoji: "🐰", status: "Active" },
    { id: 4, name: "Bird", emoji: "🐦", status: "Active" },
  ];

  const emergencyTopics = [
    {
      id: 101,
      title: "Choking",
      petIds: [1, 2],
      severity: "High",
      status: "Published",
    },
    {
      id: 102,
      title: "Heatstroke",
      petIds: [1, 3],
      severity: "High",
      status: "Published",
    },
    {
      id: 103,
      title: "Poisoning",
      petIds: [1, 2],
      severity: "High",
      status: "Published",
    },
    {
      id: 104,
      title: "Loss of Appetite",
      petIds: [2, 3],
      severity: "Medium",
      status: "Published",
    },
    {
      id: 105,
      title: "Broken Wing",
      petIds: [4],
      severity: "High",
      status: "Published",
    },
  ];

  const [guides, setGuides] = useState([
    {
      id: 1,
      topicId: 101,
      petIds: [1, 2],
      title: "Choking & Airway Blockage",
      overview:
        "Step-by-step guide to help dogs and cats experiencing choking or airway blockage.",
      severity: "Critical",
      status: "Published",
    },
    {
      id: 2,
      topicId: 102,
      petIds: [1],
      title: "Dog Heatstroke & Overheating",
      overview:
        "Guide for cooling down overheated dogs and identifying emergency signs.",
      severity: "Moderate",
      status: "Published",
    },
    {
      id: 3,
      topicId: 102,
      petIds: [3],
      title: "Rabbit Heatstroke Care",
      overview:
        "Guide for helping rabbits during overheating or heatstroke situations.",
      severity: "Critical",
      status: "Draft",
    },
    {
      id: 4,
      topicId: 105,
      petIds: [4],
      title: "Bird Wound & Bleeding Care",
      overview: "Basic first-aid guide for bird wounds and bleeding.",
      severity: "Mild",
      status: "Draft",
    },
  ]);

  const [guideSteps, setGuideSteps] = useState([
    {
      id: 1,
      guideId: 1,
      stepNumber: 1,
      instruction: "Stay calm and keep the pet still.",
      status: "Published",
    },
    {
      id: 2,
      guideId: 1,
      stepNumber: 2,
      instruction: "Check whether the pet is breathing normally.",
      status: "Published",
    },
    {
      id: 3,
      guideId: 1,
      stepNumber: 3,
      instruction: "Look inside the mouth for visible blockage.",
      status: "Published",
    },
    {
      id: 4,
      guideId: 2,
      stepNumber: 1,
      instruction: "Move the dog to a cool and shaded area.",
      status: "Published",
    },
    {
      id: 5,
      guideId: 2,
      stepNumber: 2,
      instruction: "Apply cool water gradually to the body.",
      status: "Published",
    },
    {
      id: 6,
      guideId: 3,
      stepNumber: 1,
      instruction: "Move the rabbit away from direct heat immediately.",
      status: "Draft",
    },
  ]);

  const [mediaList, setMediaList] = useState([
    {
      id: 1,
      guideId: 1,
      type: "Video",
      title: "Choking first-aid demonstration",
      url: "https://example.com/choking-video",
      caption: "Demonstration video for choking first aid.",
      status: "Published",
    },
    {
      id: 2,
      guideId: 1,
      type: "Image",
      title: "Airway check diagram",
      url: "https://example.com/airway-image",
      caption: "Image showing how to check the airway safely.",
      status: "Published",
    },
    {
      id: 3,
      guideId: 2,
      type: "Video",
      title: "Cooling overheated dogs",
      url: "https://example.com/dog-heatstroke-video",
      caption: "Video guide for dog heatstroke first aid.",
      status: "Draft",
    },
  ]);

  const [vetAdviceList, setVetAdviceList] = useState([
    {
      id: 1,
      guideId: 1,
      advice:
        "Contact a veterinarian immediately if the pet cannot breathe, collapses, or becomes unconscious.",
      urgency: "Emergency",
      status: "Published",
    },
    {
      id: 2,
      guideId: 2,
      advice:
        "Seek veterinary help if the dog remains weak, vomits, or has a high body temperature.",
      urgency: "Urgent",
      status: "Published",
    },
    {
      id: 3,
      guideId: 3,
      advice:
        "Rabbits can worsen quickly from heatstroke. Contact a vet if breathing becomes fast or the rabbit becomes weak.",
      urgency: "Emergency",
      status: "Draft",
    },
  ]);

  const [guideForm, setGuideForm] = useState({
    id: null,
    topicId: "",
    petIds: [],
    title: "",
    overview: "",
    severity: "Mild",
    status: "Draft",
  });

  const [stepForm, setStepForm] = useState({
    id: null,
    guideId: "",
    stepNumber: "",
    instruction: "",
    status: "Published",
  });

  const [mediaForm, setMediaForm] = useState({
    id: null,
    guideId: "",
    type: "Image",
    title: "",
    url: "",
    caption: "",
    status: "Draft",
  });

  const [adviceForm, setAdviceForm] = useState({
    id: null,
    guideId: "",
    advice: "",
    urgency: "General",
    status: "Draft",
  });

  const [guideSearch, setGuideSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [topicFilter, setTopicFilter] = useState("All");

  const filteredGuides = useMemo(() => {
    return guides.filter((guide) => {
      const topic = getTopicById(guide.topicId);
      const petNames = getPetNamesByGuide(guide);
      const keyword = guideSearch.toLowerCase();

      const matchesSearch =
        guide.title.toLowerCase().includes(keyword) ||
        guide.overview.toLowerCase().includes(keyword) ||
        topic?.title.toLowerCase().includes(keyword) ||
        petNames.toLowerCase().includes(keyword);

      const matchesStatus =
        statusFilter === "All" || guide.status === statusFilter;

      const matchesTopic =
        topicFilter === "All" || guide.topicId === Number(topicFilter);

      return matchesSearch && matchesStatus && matchesTopic;
    });
  }, [guides, guideSearch, statusFilter, topicFilter]);

  function openActionMenu(event, type, id) {
    const rect = event.currentTarget.getBoundingClientRect();
    const menuWidth = 180;
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
    setSelectedGuideId(null);
    setStepForm({
      id: null,
      guideId: "",
      stepNumber: "",
      instruction: "",
      status: "Published",
    });
  }

  function getTopicById(topicId) {
    return emergencyTopics.find((topic) => topic.id === Number(topicId));
  }

  function getGuideById(guideId) {
    return guides.find((guide) => guide.id === Number(guideId));
  }

  function getPetsForSelectedTopic(topicId) {
    const topic = getTopicById(topicId);

    if (!topic) return [];

    return pets.filter(
      (pet) => topic.petIds.includes(pet.id) && pet.status === "Active"
    );
  }

  function getPetNamesByGuide(guide) {
    const linkedPets = pets.filter((pet) => guide.petIds?.includes(pet.id));

    if (linkedPets.length === 0) return "No linked pet";

    return linkedPets.map((pet) => `${pet.emoji} ${pet.name}`).join(", ");
  }

  function getStepCount(guideId) {
    return guideSteps.filter(
      (step) => step.guideId === Number(guideId) && step.status !== "Archived"
    ).length;
  }

  function getNextStepNumber(guideId) {
    const stepsForGuide = guideSteps.filter(
      (step) => step.guideId === Number(guideId) && step.status !== "Archived"
    );

    if (stepsForGuide.length === 0) return 1;

    return Math.max(...stepsForGuide.map((step) => step.stepNumber)) + 1;
  }

  function getMediaSummary(guideId) {
    const activeMedia = mediaList.filter(
      (media) => media.guideId === guideId && media.status !== "Archived"
    );

    const imageCount = activeMedia.filter(
      (media) => media.type === "Image"
    ).length;

    const videoCount = activeMedia.filter(
      (media) => media.type === "Video"
    ).length;

    if (imageCount === 0 && videoCount === 0) return "No media";

    return `${imageCount} image${imageCount !== 1 ? "s" : ""}, ${videoCount} video${
      videoCount !== 1 ? "s" : ""
    }`;
  }

  function handleGuidePetToggle(petId) {
    setGuideForm((prevForm) => {
      const alreadySelected = prevForm.petIds.includes(petId);

      return {
        ...prevForm,
        petIds: alreadySelected
          ? prevForm.petIds.filter((id) => id !== petId)
          : [...prevForm.petIds, petId],
      };
    });
  }

  function openAddGuideModal() {
    closeActionMenu();

    setGuideForm({
      id: null,
      topicId: "",
      petIds: [],
      title: "",
      overview: "",
      severity: "Mild",
      status: "Draft",
    });

    setModalType("guide");
  }

  function openEditGuideModal(guide) {
    closeActionMenu();

    setGuideForm({
      id: guide.id,
      topicId: guide.topicId,
      petIds: guide.petIds || [],
      title: guide.title,
      overview: guide.overview,
      severity: guide.severity,
      status: guide.status,
    });

    setModalType("guide");
  }

  function openStepsModal(guideId) {
    closeActionMenu();
    setSelectedGuideId(guideId);

    setStepForm({
      id: null,
      guideId,
      stepNumber: getNextStepNumber(guideId),
      instruction: "",
      status: "Published",
    });

    setModalType("steps");
  }

  function openAddMediaModal() {
    closeActionMenu();

    setMediaForm({
      id: null,
      guideId: "",
      type: "Image",
      title: "",
      url: "",
      caption: "",
      status: "Draft",
    });

    setModalType("media");
  }

  function openEditMediaModal(media) {
    closeActionMenu();

    setMediaForm({
      id: media.id,
      guideId: media.guideId,
      type: media.type,
      title: media.title,
      url: media.url,
      caption: media.caption,
      status: media.status,
    });

    setModalType("media");
  }

  function openAddAdviceModal() {
    closeActionMenu();

    setAdviceForm({
      id: null,
      guideId: "",
      advice: "",
      urgency: "General",
      status: "Draft",
    });

    setModalType("advice");
  }

  function openEditAdviceModal(advice) {
    closeActionMenu();

    setAdviceForm({
      id: advice.id,
      guideId: advice.guideId,
      advice: advice.advice,
      urgency: advice.urgency,
      status: advice.status,
    });

    setModalType("advice");
  }

  function handleGuideSubmit(event) {
    event.preventDefault();

    if (!guideForm.topicId) {
      alert("Please select an emergency topic.");
      return;
    }

    if (guideForm.petIds.length === 0) {
      alert("Please select at least one pet type for this guide.");
      return;
    }

    if (!guideForm.title.trim()) {
      alert("Please enter the guide title.");
      return;
    }

    if (guideForm.status === "Published" && guideForm.id) {
      const stepCount = getStepCount(guideForm.id);

      if (stepCount === 0) {
        alert("A guide must have at least one step before publishing.");
        return;
      }
    }

    if (guideForm.status === "Published" && !guideForm.id) {
      alert(
        "New guides should be saved as Draft first. Add steps before publishing."
      );
      return;
    }

    if (guideForm.id) {
      setGuides((prevGuides) =>
        prevGuides.map((guide) =>
          guide.id === guideForm.id
            ? {
                ...guide,
                topicId: Number(guideForm.topicId),
                petIds: guideForm.petIds,
                title: guideForm.title,
                overview: guideForm.overview,
                severity: guideForm.severity,
                status: guideForm.status,
              }
            : guide
        )
      );

      closeModal();
      return;
    }

    const newGuide = {
      id: Date.now(),
      topicId: Number(guideForm.topicId),
      petIds: guideForm.petIds,
      title: guideForm.title,
      overview: guideForm.overview,
      severity: guideForm.severity,
      status: guideForm.status,
    };

    setGuides((prevGuides) => [...prevGuides, newGuide]);
    closeModal();
  }

  function handleStepSubmit(event) {
    event.preventDefault();

    if (!stepForm.guideId) {
      alert("Please select a guide.");
      return;
    }

    if (!stepForm.stepNumber) {
      alert("Please enter the step number.");
      return;
    }

    if (!stepForm.instruction.trim()) {
      alert("Please enter the step instruction.");
      return;
    }

    if (stepForm.id) {
      setGuideSteps((prevSteps) =>
        prevSteps.map((step) =>
          step.id === stepForm.id
            ? {
                ...step,
                stepNumber: Number(stepForm.stepNumber),
                instruction: stepForm.instruction,
                status: stepForm.status,
              }
            : step
        )
      );

      setStepForm({
        id: null,
        guideId: selectedGuideId,
        stepNumber: getNextStepNumber(selectedGuideId),
        instruction: "",
        status: "Published",
      });

      return;
    }

    const newStep = {
      id: Date.now(),
      guideId: Number(stepForm.guideId),
      stepNumber: Number(stepForm.stepNumber),
      instruction: stepForm.instruction,
      status: stepForm.status,
    };

    setGuideSteps((prevSteps) => [...prevSteps, newStep]);

    setStepForm({
      id: null,
      guideId: selectedGuideId,
      stepNumber: Number(stepForm.stepNumber) + 1,
      instruction: "",
      status: "Published",
    });
  }

  function cancelStepEdit() {
    setStepForm({
      id: null,
      guideId: selectedGuideId,
      stepNumber: getNextStepNumber(selectedGuideId),
      instruction: "",
      status: "Published",
    });
  }

  function handleMediaSubmit(event) {
    event.preventDefault();

    if (!mediaForm.guideId) {
      alert("Please select a guide.");
      return;
    }

    if (!mediaForm.title.trim()) {
      alert("Please enter the media title.");
      return;
    }

    if (mediaForm.id) {
      setMediaList((prevMedia) =>
        prevMedia.map((media) =>
          media.id === mediaForm.id
            ? {
                ...media,
                guideId: Number(mediaForm.guideId),
                type: mediaForm.type,
                title: mediaForm.title,
                url: mediaForm.url,
                caption: mediaForm.caption,
                status: mediaForm.status,
              }
            : media
        )
      );

      closeModal();
      return;
    }

    const newMedia = {
      id: Date.now(),
      guideId: Number(mediaForm.guideId),
      type: mediaForm.type,
      title: mediaForm.title,
      url: mediaForm.url,
      caption: mediaForm.caption,
      status: mediaForm.status,
    };

    setMediaList((prevMedia) => [...prevMedia, newMedia]);
    closeModal();
  }

  function handleAdviceSubmit(event) {
    event.preventDefault();

    if (!adviceForm.guideId) {
      alert("Please select a guide.");
      return;
    }

    if (!adviceForm.advice.trim()) {
      alert("Please enter veterinary advice.");
      return;
    }

    if (adviceForm.id) {
      setVetAdviceList((prevAdvice) =>
        prevAdvice.map((advice) =>
          advice.id === adviceForm.id
            ? {
                ...advice,
                guideId: Number(adviceForm.guideId),
                advice: adviceForm.advice,
                urgency: adviceForm.urgency,
                status: adviceForm.status,
              }
            : advice
        )
      );

      closeModal();
      return;
    }

    const newAdvice = {
      id: Date.now(),
      guideId: Number(adviceForm.guideId),
      advice: adviceForm.advice,
      urgency: adviceForm.urgency,
      status: adviceForm.status,
    };

    setVetAdviceList((prevAdvice) => [...prevAdvice, newAdvice]);
    closeModal();
  }

  function updateGuideStatus(id, status) {
    if (status === "Published" && getStepCount(id) === 0) {
      alert("A guide must have at least one step before publishing.");
      return;
    }

    setGuides((prevGuides) =>
      prevGuides.map((guide) =>
        guide.id === id ? { ...guide, status } : guide
      )
    );
  }

  function updateMediaStatus(id, status) {
    setMediaList((prevMedia) =>
      prevMedia.map((media) =>
        media.id === id ? { ...media, status } : media
      )
    );
  }

  function updateAdviceStatus(id, status) {
    setVetAdviceList((prevAdvice) =>
      prevAdvice.map((advice) =>
        advice.id === id ? { ...advice, status } : advice
      )
    );
  }

  function archiveStep(id) {
    setGuideSteps((prevSteps) =>
      prevSteps.map((step) =>
        step.id === id ? { ...step, status: "Archived" } : step
      )
    );
  }

  function publishStep(id) {
    setGuideSteps((prevSteps) =>
      prevSteps.map((step) =>
        step.id === id ? { ...step, status: "Published" } : step
      )
    );
  }

  function editStep(step) {
    setStepForm({
      id: step.id,
      guideId: step.guideId,
      stepNumber: step.stepNumber,
      instruction: step.instruction,
      status: step.status,
    });

    setTimeout(() => {
      document
        .querySelector(".mgc-step-form")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  }

  function renderFloatingActionMenu() {
    if (!actionMenu) return null;

    if (actionMenu.type === "guide") {
      const guide = guides.find((item) => item.id === actionMenu.id);
      if (!guide) return null;

      return (
        <>
          <div className="floating-menu-backdrop" onClick={closeActionMenu} />

          <div
            className="floating-action-menu"
            style={{ left: `${actionMenu.left}px`, top: `${actionMenu.top}px` }}
          >
            <button onClick={() => openEditGuideModal(guide)}>Edit Guide</button>
            <button onClick={() => openStepsModal(guide.id)}>Manage Steps</button>

            {guide.status === "Published" && (
              <button
                onClick={() => {
                  updateGuideStatus(guide.id, "Draft");
                  closeActionMenu();
                }}
              >
                Move to Draft
              </button>
            )}

            {(guide.status === "Draft" || guide.status === "Archived") && (
              <button
                onClick={() => {
                  updateGuideStatus(guide.id, "Published");
                  closeActionMenu();
                }}
              >
                Publish
              </button>
            )}

            {guide.status !== "Archived" && (
              <button
                className="danger-text"
                onClick={() => {
                  updateGuideStatus(guide.id, "Archived");
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

    if (actionMenu.type === "media") {
      const media = mediaList.find((item) => item.id === actionMenu.id);
      if (!media) return null;

      return (
        <>
          <div className="floating-menu-backdrop" onClick={closeActionMenu} />

          <div
            className="floating-action-menu"
            style={{ left: `${actionMenu.left}px`, top: `${actionMenu.top}px` }}
          >
            <button onClick={() => openEditMediaModal(media)}>Edit Media</button>

            {media.status === "Published" && (
              <button
                onClick={() => {
                  updateMediaStatus(media.id, "Draft");
                  closeActionMenu();
                }}
              >
                Move to Draft
              </button>
            )}

            {(media.status === "Draft" || media.status === "Archived") && (
              <button
                onClick={() => {
                  updateMediaStatus(media.id, "Published");
                  closeActionMenu();
                }}
              >
                Publish
              </button>
            )}

            {media.status !== "Archived" && (
              <button
                className="danger-text"
                onClick={() => {
                  updateMediaStatus(media.id, "Archived");
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

    if (actionMenu.type === "advice") {
      const advice = vetAdviceList.find((item) => item.id === actionMenu.id);
      if (!advice) return null;

      return (
        <>
          <div className="floating-menu-backdrop" onClick={closeActionMenu} />

          <div
            className="floating-action-menu"
            style={{ left: `${actionMenu.left}px`, top: `${actionMenu.top}px` }}
          >
            <button onClick={() => openEditAdviceModal(advice)}>
              Edit Advice
            </button>

            {advice.status === "Published" && (
              <button
                onClick={() => {
                  updateAdviceStatus(advice.id, "Draft");
                  closeActionMenu();
                }}
              >
                Move to Draft
              </button>
            )}

            {(advice.status === "Draft" || advice.status === "Archived") && (
              <button
                onClick={() => {
                  updateAdviceStatus(advice.id, "Published");
                  closeActionMenu();
                }}
              >
                Publish
              </button>
            )}

            {advice.status !== "Archived" && (
              <button
                className="danger-text"
                onClick={() => {
                  updateAdviceStatus(advice.id, "Archived");
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

  function renderGuideModal() {
    if (modalType !== "guide") return null;

    const petsForTopic = getPetsForSelectedTopic(guideForm.topicId);

    return (
      <div className="modal-backdrop" onClick={closeModal}>
        <section
          className="admin-modal"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="modal-header">
            <div>
              <p className="page-subtitle">Guide Content</p>
              <h2>{guideForm.id ? "Edit Guide" : "Add Guide"}</h2>
            </div>

            <button className="modal-close-btn" onClick={closeModal}>
              ×
            </button>
          </div>

          <form onSubmit={handleGuideSubmit} className="admin-form">
            <label>
              Emergency Topic
              <select
                value={guideForm.topicId}
                onChange={(event) =>
                  setGuideForm({
                    ...guideForm,
                    topicId: event.target.value,
                    petIds: [],
                  })
                }
              >
                <option value="">Select emergency topic</option>
                {emergencyTopics
                  .filter((topic) => topic.status === "Published")
                  .map((topic) => (
                    <option key={topic.id} value={topic.id}>
                      {topic.title}
                    </option>
                  ))}
              </select>
            </label>

            <div className="manage-guide-form-group">
              <p className="manage-guide-form-label">Pet Type for This Guide</p>

              {!guideForm.topicId ? (
                <p className="manage-guide-selected-note">
                  Please select an emergency topic first.
                </p>
              ) : petsForTopic.length === 0 ? (
                <p className="manage-guide-selected-note">
                  No active pet types are linked to this emergency topic.
                </p>
              ) : (
                <div className="manage-guide-checkbox-grid">
                  {petsForTopic.map((pet) => (
                    <label key={pet.id} className="manage-guide-checkbox-card">
                      <input
                        type="checkbox"
                        checked={guideForm.petIds.includes(pet.id)}
                        onChange={() => handleGuidePetToggle(pet.id)}
                      />

                      <span>
                        {pet.emoji} {pet.name}
                      </span>
                    </label>
                  ))}
                </div>
              )}

              {guideForm.petIds.length > 0 && (
                <p className="manage-guide-selected-note">
                  Selected:{" "}
                  {pets
                    .filter((pet) => guideForm.petIds.includes(pet.id))
                    .map((pet) => pet.name)
                    .join(", ")}
                </p>
              )}
            </div>

            <label>
              Guide Title
              <input
                type="text"
                placeholder="Example: Dog Choking First Aid"
                value={guideForm.title}
                onChange={(event) =>
                  setGuideForm({ ...guideForm, title: event.target.value })
                }
              />
            </label>

            <label>
              Overview
              <textarea
                rows="4"
                placeholder="Short overview of this guide"
                value={guideForm.overview}
                onChange={(event) =>
                  setGuideForm({ ...guideForm, overview: event.target.value })
                }
              />
            </label>

            <label>
              Severity
              <select
                value={guideForm.severity}
                onChange={(event) =>
                  setGuideForm({ ...guideForm, severity: event.target.value })
                }
              >
                <option value="Mild">Mild</option>
                <option value="Moderate">Moderate</option>
                <option value="Critical">Critical</option>
              </select>
            </label>

            <label>
              Status
              <select
                value={guideForm.status}
                onChange={(event) =>
                  setGuideForm({ ...guideForm, status: event.target.value })
                }
              >
                <option value="Draft">Draft</option>
                <option value="Published">Published</option>
                <option value="Archived">Archived</option>
              </select>
            </label>

            <div className="form-actions">
              <button type="submit" className="primary-btn">
                {guideForm.id ? "Save Changes" : "+ Add Guide"}
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

  function renderStepsModal() {
    if (modalType !== "steps") return null;

    const selectedGuide = getGuideById(selectedGuideId);
    const selectedSteps = guideSteps
      .filter((step) => step.guideId === selectedGuideId)
      .sort((a, b) => a.stepNumber - b.stepNumber);

    return (
      <div className="modal-backdrop" onClick={closeModal}>
        <section
          className="admin-modal mgc-large-modal"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="modal-header">
            <div>
              <p className="page-subtitle">First-Aid Steps</p>
              <h2>{selectedGuide?.title}</h2>
            </div>

            <button className="modal-close-btn" onClick={closeModal}>
              ×
            </button>
          </div>

          <div className="mgc-step-list">
            {selectedSteps.length > 0 ? (
              selectedSteps.map((step) => (
                <div
                  key={step.id}
                  className={`mgc-step-card ${
                    step.status === "Archived" ? "mgc-step-card-archived" : ""
                  }`}
                >
                  <div className="mgc-step-info">
                    <div className="mgc-step-top">
                      <strong className="mgc-step-title">
                        Step {step.stepNumber}
                      </strong>

                      <span
                        className={`mgc-step-pill mgc-step-pill-${step.status.toLowerCase()}`}
                      >
                        {step.status}
                      </span>
                    </div>

                    <p className="mgc-step-text">{step.instruction}</p>
                  </div>

                  <div className="mgc-step-buttons">
                    <button
                      type="button"
                      className="mgc-step-btn"
                      onClick={() => editStep(step)}
                    >
                      Edit
                    </button>

                    {step.status === "Archived" ? (
                      <button
                        type="button"
                        className="mgc-step-btn"
                        onClick={() => publishStep(step.id)}
                      >
                        Publish
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="mgc-step-btn mgc-step-btn-archive"
                        onClick={() => archiveStep(step.id)}
                      >
                        Archive
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="empty-table-text">No steps added yet.</p>
            )}
          </div>

          <form onSubmit={handleStepSubmit} className="admin-form mgc-step-form">
            <h3>{stepForm.id ? "Edit Step" : "Add New Step"}</h3>

            <label>
              Step Number
              <input
                type="number"
                min="1"
                value={stepForm.stepNumber}
                onChange={(event) =>
                  setStepForm({ ...stepForm, stepNumber: event.target.value })
                }
              />
            </label>

            <label>
              Instruction
              <textarea
                rows="3"
                placeholder="Enter the first-aid instruction"
                value={stepForm.instruction}
                onChange={(event) =>
                  setStepForm({ ...stepForm, instruction: event.target.value })
                }
              />
            </label>

            <label>
              Status
              <select
                value={stepForm.status}
                onChange={(event) =>
                  setStepForm({ ...stepForm, status: event.target.value })
                }
              >
                <option value="Draft">Draft</option>
                <option value="Published">Published</option>
                <option value="Archived">Archived</option>
              </select>
            </label>

            <div className="form-actions">
              <button type="submit" className="primary-btn">
                {stepForm.id ? "Save Step Changes" : "+ Add Step"}
              </button>

              {stepForm.id && (
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={cancelStepEdit}
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

  function renderMediaModal() {
    if (modalType !== "media") return null;

    return (
      <div className="modal-backdrop" onClick={closeModal}>
        <section
          className="admin-modal"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="modal-header">
            <div>
              <p className="page-subtitle">Multimedia</p>
              <h2>{mediaForm.id ? "Edit Media" : "Add Media"}</h2>
            </div>

            <button className="modal-close-btn" onClick={closeModal}>
              ×
            </button>
          </div>

          <form onSubmit={handleMediaSubmit} className="admin-form">
            <label>
              Guide
              <select
                value={mediaForm.guideId}
                onChange={(event) =>
                  setMediaForm({ ...mediaForm, guideId: event.target.value })
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
              Media Type
              <select
                value={mediaForm.type}
                onChange={(event) =>
                  setMediaForm({ ...mediaForm, type: event.target.value })
                }
              >
                <option value="Image">Image</option>
                <option value="Video">Video</option>
              </select>
            </label>

            <label>
              Media Title
              <input
                type="text"
                placeholder="Example: Choking first-aid demonstration"
                value={mediaForm.title}
                onChange={(event) =>
                  setMediaForm({ ...mediaForm, title: event.target.value })
                }
              />
            </label>

            <label>
              URL / File Path
              <input
                type="text"
                placeholder="Example: https://example.com/video"
                value={mediaForm.url}
                onChange={(event) =>
                  setMediaForm({ ...mediaForm, url: event.target.value })
                }
              />
            </label>

            <label>
              Caption
              <textarea
                rows="3"
                placeholder="Short description for this media"
                value={mediaForm.caption}
                onChange={(event) =>
                  setMediaForm({ ...mediaForm, caption: event.target.value })
                }
              />
            </label>

            <label>
              Status
              <select
                value={mediaForm.status}
                onChange={(event) =>
                  setMediaForm({ ...mediaForm, status: event.target.value })
                }
              >
                <option value="Draft">Draft</option>
                <option value="Published">Published</option>
                <option value="Archived">Archived</option>
              </select>
            </label>

            <div className="form-actions">
              <button type="submit" className="primary-btn">
                {mediaForm.id ? "Save Changes" : "+ Add Media"}
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

  function renderAdviceModal() {
    if (modalType !== "advice") return null;

    return (
      <div className="modal-backdrop" onClick={closeModal}>
        <section
          className="admin-modal"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="modal-header">
            <div>
              <p className="page-subtitle">Veterinary Advice</p>
              <h2>{adviceForm.id ? "Edit Vet Advice" : "Add Vet Advice"}</h2>
            </div>

            <button className="modal-close-btn" onClick={closeModal}>
              ×
            </button>
          </div>

          <form onSubmit={handleAdviceSubmit} className="admin-form">
            <label>
              Guide
              <select
                value={adviceForm.guideId}
                onChange={(event) =>
                  setAdviceForm({ ...adviceForm, guideId: event.target.value })
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
              Advice
              <textarea
                rows="5"
                placeholder="Enter veterinary advice"
                value={adviceForm.advice}
                onChange={(event) =>
                  setAdviceForm({ ...adviceForm, advice: event.target.value })
                }
              />
            </label>

            <label>
              Urgency
              <select
                value={adviceForm.urgency}
                onChange={(event) =>
                  setAdviceForm({ ...adviceForm, urgency: event.target.value })
                }
              >
                <option value="General">General</option>
                <option value="Urgent">Urgent</option>
                <option value="Emergency">Emergency</option>
              </select>
            </label>

            <label>
              Status
              <select
                value={adviceForm.status}
                onChange={(event) =>
                  setAdviceForm({ ...adviceForm, status: event.target.value })
                }
              >
                <option value="Draft">Draft</option>
                <option value="Published">Published</option>
                <option value="Archived">Archived</option>
              </select>
            </label>

            <div className="form-actions">
              <button type="submit" className="primary-btn">
                {adviceForm.id ? "Save Changes" : "+ Add Advice"}
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
    <div className="admin-page manage-guide-page">
      {renderFloatingActionMenu()}
      {renderGuideModal()}
      {renderStepsModal()}
      {renderMediaModal()}
      {renderAdviceModal()}

      <div className="page-title-row">
        <div className="page-title-area">
          <p className="page-subtitle">Admin Management</p>
          <h1>Manage Guide Content</h1>
        </div>
      </div>

      <div className="admin-tabs">
        <button
          className={activeTab === "guides" ? "active" : ""}
          onClick={() => {
            setActiveTab("guides");
            closeActionMenu();
          }}
        >
          Guides & Steps
        </button>

        <button
          className={activeTab === "media" ? "active" : ""}
          onClick={() => {
            setActiveTab("media");
            closeActionMenu();
          }}
        >
          Multimedia
        </button>

        <button
          className={activeTab === "advice" ? "active" : ""}
          onClick={() => {
            setActiveTab("advice");
            closeActionMenu();
          }}
        >
          Vet Advice
        </button>
      </div>

      {activeTab === "guides" && (
        <section className="admin-table-card">
          <div className="table-header-row">
            <div>
              <h2>First-Aid Guide List</h2>
              <p className="form-note">
                Guides are linked to both an emergency topic and pet type. A
                guide should have at least one step before it is published.
              </p>
            </div>

            <button className="primary-btn table-add-btn" onClick={openAddGuideModal}>
              + Add Guide
            </button>
          </div>

          <div className="filter-row guide-filter-row">
            <input
              type="text"
              placeholder="Search by guide title, emergency topic, or pet type..."
              value={guideSearch}
              onChange={(event) => setGuideSearch(event.target.value)}
            />

            <select
              value={topicFilter}
              onChange={(event) => setTopicFilter(event.target.value)}
            >
              <option value="All">All Topics</option>
              {emergencyTopics.map((topic) => (
                <option key={topic.id} value={topic.id}>
                  {topic.title}
                </option>
              ))}
            </select>

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
            <table className="admin-table guide-table">
              <thead>
                <tr>
                  <th>Guide Title</th>
                  <th>Emergency Topic</th>
                  <th>Pet Type</th>
                  <th>Steps</th>
                  <th>Media</th>
                  <th>Severity</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredGuides.length > 0 ? (
                  filteredGuides.map((guide) => (
                    <tr key={guide.id}>
                      <td>
                        <strong className="cell-title">{guide.title}</strong>
                        <p className="table-small-text">{guide.overview}</p>
                      </td>

                      <td>{getTopicById(guide.topicId)?.title}</td>

                      <td>
                        <span className="long-table-text">
                          {getPetNamesByGuide(guide)}
                        </span>
                      </td>

                      <td>{getStepCount(guide.id)}</td>

                      <td>
                        <span className="long-table-text">
                          {getMediaSummary(guide.id)}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`severity-badge ${guide.severity.toLowerCase()}`}
                        >
                          {guide.severity}
                        </span>
                      </td>

                      <td>
                        <span
                          className={
                            guide.status === "Published"
                              ? "status-badge"
                              : guide.status === "Draft"
                              ? "status-badge draft"
                              : "status-badge archived"
                          }
                        >
                          {guide.status}
                        </span>
                      </td>

                      <td>
                        <button
                          className="three-dot-btn"
                          onClick={(event) =>
                            openActionMenu(event, "guide", guide.id)
                          }
                        >
                          ⋯
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="empty-table-text">
                      No guides found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {activeTab === "media" && (
        <section className="admin-table-card">
          <div className="table-header-row">
            <div>
              <h2>Multimedia List</h2>
              <p className="form-note">
                Manage images and videos that support pet-specific first-aid
                guides.
              </p>
            </div>

            <button className="primary-btn table-add-btn" onClick={openAddMediaModal}>
              + Add Media
            </button>
          </div>

          <p className="table-scroll-note">
            Scroll sideways to view more columns on smaller screens.
          </p>

          <div className="table-responsive">
            <table className="admin-table media-table">
              <thead>
                <tr>
                  <th>Media Title</th>
                  <th>Guide</th>
                  <th>Pet Type</th>
                  <th>Type</th>
                  <th>Caption</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {mediaList.map((media) => {
                  const guide = getGuideById(media.guideId);

                  return (
                    <tr key={media.id}>
                      <td>
                        <strong className="cell-title">{media.title}</strong>
                        <p className="table-small-text">{media.url}</p>
                      </td>

                      <td>{guide?.title}</td>

                      <td>
                        <span className="long-table-text">
                          {guide ? getPetNamesByGuide(guide) : "Unknown guide"}
                        </span>
                      </td>

                      <td>{media.type}</td>

                      <td>
                        <span className="long-table-text">{media.caption}</span>
                      </td>

                      <td>
                        <span
                          className={
                            media.status === "Published"
                              ? "status-badge"
                              : media.status === "Draft"
                              ? "status-badge draft"
                              : "status-badge archived"
                          }
                        >
                          {media.status}
                        </span>
                      </td>

                      <td>
                        <button
                          className="three-dot-btn"
                          onClick={(event) =>
                            openActionMenu(event, "media", media.id)
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

      {activeTab === "advice" && (
        <section className="admin-table-card">
          <div className="table-header-row">
            <div>
              <h2>Veterinary Advice List</h2>
              <p className="form-note">
                Manage advice shown under each pet-specific first-aid guide.
              </p>
            </div>

            <button
              className="primary-btn table-add-btn"
              onClick={openAddAdviceModal}
            >
              + Add Vet Advice
            </button>
          </div>

          <p className="table-scroll-note">
            Scroll sideways to view more columns on smaller screens.
          </p>

          <div className="table-responsive">
            <table className="admin-table advice-table">
              <thead>
                <tr>
                  <th>Advice</th>
                  <th>Guide</th>
                  <th>Pet Type</th>
                  <th>Urgency</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {vetAdviceList.map((advice) => {
                  const guide = getGuideById(advice.guideId);

                  return (
                    <tr key={advice.id}>
                      <td>
                        <span className="long-table-text">{advice.advice}</span>
                      </td>

                      <td>{guide?.title}</td>

                      <td>
                        <span className="long-table-text">
                          {guide ? getPetNamesByGuide(guide) : "Unknown guide"}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`severity-badge ${advice.urgency.toLowerCase()}`}
                        >
                          {advice.urgency}
                        </span>
                      </td>

                      <td>
                        <span
                          className={
                            advice.status === "Published"
                              ? "status-badge"
                              : advice.status === "Draft"
                              ? "status-badge draft"
                              : "status-badge archived"
                          }
                        >
                          {advice.status}
                        </span>
                      </td>

                      <td>
                        <button
                          className="three-dot-btn"
                          onClick={(event) =>
                            openActionMenu(event, "advice", advice.id)
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
    </div>
  );
}

export default ManageGuideContent;