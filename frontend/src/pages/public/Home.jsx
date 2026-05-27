import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function Home() {
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [selectedPet, setSelectedPet] = useState("");
  const [pets, setPets] = useState([]);
  const [commonEmergencies, setCommonEmergencies] = useState([]);
  const [loading, setLoading] = useState(true);

  const severityClass = {
    Critical: "red",
    High: "red",
    Moderate: "amber",
    Medium: "amber",
    Mild: "green",
    Low: "green",
  };

  useEffect(() => {
    let isCancelled = false;

    async function loadHomeData() {
      try {
        setLoading(true);

        const response = await fetch(`${API_URL}/api/emergency-topics`);

        let data = {};
        try {
          data = await response.json();
        } catch {
          data = {};
        }

        if (!response.ok) {
          throw new Error(data.message || "Failed to load emergency topics.");
        }

        if (isCancelled) return;

        const topics = Array.isArray(data.topics) ? data.topics : [];

        // ==========================
        // PET TYPES FROM DATABASE
        // ==========================
        const petMap = new Map();

        topics.forEach((topic) => {
          const petName = topic.petName?.trim();
          const icon = topic.icon || "🐾";

          if (!petName) return;

          const key = petName.toLowerCase();

          if (!petMap.has(key)) {
            petMap.set(key, {
              name: petName,
              icon,
              count: 1,
            });
          } else {
            const existingPet = petMap.get(key);
            petMap.set(key, {
              ...existingPet,
              count: existingPet.count + 1,
            });
          }
        });

        const petList = Array.from(petMap.values()).sort((a, b) =>
          a.name.localeCompare(b.name)
        );

        setPets(petList);

        if (petList.length > 0) {
          setSelectedPet((prev) => {
            const stillExists = petList.some((pet) => pet.name === prev);
            return stillExists ? prev : petList[0].name;
          });
        } else {
          setSelectedPet("");
        }

        // ==========================
        // COMMON EMERGENCIES FROM DATABASE
        // ==========================
        const severityPriority = {
          Critical: 1,
          High: 2,
          Moderate: 3,
          Medium: 4,
          Mild: 5,
          Low: 6,
        };

        const databaseEmergencies = [...topics]
          .sort((a, b) => {
            const aPriority = severityPriority[a.severity] || 99;
            const bPriority = severityPriority[b.severity] || 99;

            if (aPriority !== bPriority) {
              return aPriority - bPriority;
            }

            return String(a.topicTitle || "").localeCompare(
              String(b.topicTitle || "")
            );
          })
          .slice(0, 4);

        setCommonEmergencies(databaseEmergencies);
      } catch (error) {
        console.error("Load home data error:", error);

        if (!isCancelled) {
          setPets([]);
          setCommonEmergencies([]);
          setSelectedPet("");
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    loadHomeData();

    return () => {
      isCancelled = true;
    };
  }, []);

  function goSearch() {
    const keyword = search.trim();

    if (keyword) {
      navigate(`/emergency-search?keyword=${encodeURIComponent(keyword)}`);
    } else {
      navigate("/emergency-search");
    }
  }

  function browseSelectedPet() {
    if (!selectedPet) {
      navigate("/emergency-search");
      return;
    }

    navigate(`/emergency-search?pet=${encodeURIComponent(selectedPet)}`);
  }

  function getSeverityIcon(topic) {
    if (topic.icon) return topic.icon;

    if (topic.severity === "Critical" || topic.severity === "High") {
      return "🚨";
    }

    if (topic.severity === "Moderate" || topic.severity === "Medium") {
      return "⚠️";
    }

    return "🌿";
  }

  return (
    <main className="home-page">
      <section className="home-hero-section">
        <div className="home-hero-container">
          <div className="home-hero-left">
            <div className="home-badge">
              <span></span>
              Pet emergency help, anytime
            </div>

            <h1>Quick first-aid guide for your pet emergency</h1>

            <p>
              Choose your pet, search the emergency topic, and follow clear
              first-aid steps while contacting a vet.
            </p>

            <div className="home-search-mini">
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    goSearch();
                  }
                }}
                placeholder="Search e.g. choking, poison, bleeding..."
              />

              <button type="button" onClick={goSearch}>
                Search
              </button>
            </div>

            <div className="home-buttons">
              <Link to="/emergency-search" className="home-btn-fill">
                🚨 Start Emergency Search
              </Link>

              <Link to="/quiz" className="home-btn-outline">
                Take Quiz
              </Link>
            </div>
          </div>

          <div className="home-hero-right">
            <div className="home-emergency-card">
              <div className="home-card-title">
                <div className="home-dog-icon">
                  {commonEmergencies[0]?.icon || "🐾"}
                </div>

                <div>
                  <h3>Common emergencies</h3>
                  <p>Tap one to view its guide</p>
                </div>
              </div>

              {loading ? (
                <div className="home-emergency-empty">
                  Loading emergencies...
                </div>
              ) : commonEmergencies.length > 0 ? (
                commonEmergencies.map((topic) => (
                  <Link
                    key={topic.emergencyID}
                    to={`/guide-details/${topic.emergencyID}`}
                    className={`home-emergency-item ${
                      severityClass[topic.severity] || "amber"
                    }`}
                  >
                    <span>{getSeverityIcon(topic)}</span>
                    {topic.topicTitle}
                    <b>›</b>
                  </Link>
                ))
              ) : (
                <div className="home-emergency-empty">
                  No emergency guides found yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="home-pet-section">
        <p className="home-section-label">Select your pet</p>

        <h2>What pet do you have?</h2>

        <p>Get emergency guides tailored to your pet's species.</p>

        <div className="home-pet-grid">
          {loading && (
            <div className="home-pet-empty">
              Loading pet types from database...
            </div>
          )}

          {!loading && pets.length === 0 && (
            <div className="home-pet-empty">
              No pet types found yet. Please add emergency topics from admin.
            </div>
          )}

          {!loading &&
            pets.map((pet) => (
              <button
                key={pet.name}
                type="button"
                onClick={() => setSelectedPet(pet.name)}
                className={`home-pet-card ${
                  selectedPet === pet.name ? "active" : ""
                }`}
              >
                <span>{pet.icon || "🐾"}</span>

                <h4>{pet.name}</h4>

                <p>
                  {pet.count} {pet.count === 1 ? "guide" : "guides"}
                </p>
              </button>
            ))}
        </div>

        <div className="home-pet-browse">
          <button
            type="button"
            className="home-pet-browse-btn"
            onClick={browseSelectedPet}
            disabled={!selectedPet}
          >
            {selectedPet ? `Browse ${selectedPet} Guides →` : "Browse Guides →"}
          </button>
        </div>
      </section>

      <section className="home-feature-section">
        <p className="home-section-label">Why PawGuard</p>

        <h2>Everything you need in an emergency</h2>

        <p>
          Calm, clear, and fast — designed for the moments that matter most.
        </p>

        <div className="home-feature-grid">
          <div className="home-feature-card sage-border">
            <span>📋</span>

            <h3>Step-by-step first-aid</h3>

            <p>
              Clear numbered instructions with veterinary guidance so you always
              know the next right action.
            </p>

            <Link to="/emergency-search" className="home-feature-link">
              Browse guides →
            </Link>
          </div>

          <div className="home-feature-card red-border">
            <span>🧠</span>

            <h3>Quiz & test yourself</h3>

            <p>
              Test your pet first-aid knowledge with interactive quizzes and
              track your improvement over time.
            </p>

            <Link to="/quiz" className="home-feature-link">
              Start a quiz →
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}