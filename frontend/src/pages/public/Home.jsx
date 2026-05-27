import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function Home() {
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [selectedPet, setSelectedPet] = useState("");
  const [pets, setPets] = useState([]);
  const [topTopics, setTopTopics] = useState([]);

  const [loadingPets, setLoadingPets] = useState(true);

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

    async function fetchData() {
      try {
        setLoadingPets(true);

        const res = await fetch(`${API_URL}/api/emergency-topics`);

        let data = {};
        try {
          data = await res.json();
        } catch {
          data = {};
        }

        if (!res.ok) {
          throw new Error(data.message || "Failed to load emergency topics.");
        }

        if (isCancelled) return;

        const topics = data.topics || [];

        const petMap = {};

        topics.forEach((topic) => {
          const petName = topic.petName || "Other";
          const icon = topic.icon || "🐾";

          if (!petMap[petName]) {
            petMap[petName] = {
              name: petName,
              icon,
              count: 0,
            };
          }

          petMap[petName].count += 1;
        });

        const petOrder = ["Dog", "Cat", "Rabbit", "Bird"];

        const sortedPets = [
          ...petOrder
            .filter((name) => petMap[name])
            .map((name) => petMap[name]),
          ...Object.values(petMap).filter(
            (pet) => !petOrder.includes(pet.name)
          ),
        ];

        setPets(sortedPets);

        if (sortedPets.length > 0) {
          setSelectedPet((prev) => {
            const stillExists = sortedPets.some((pet) => pet.name === prev);
            return stillExists ? prev : sortedPets[0].name;
          });
        } else {
          setSelectedPet("");
        }

        const top = topics
          .filter(
            (topic) =>
              topic.severity === "Critical" ||
              topic.severity === "High" ||
              topic.severity === "Moderate"
          )
          .slice(0, 4);

        setTopTopics(top);
      } catch (error) {
        console.error("Load home data error:", error);

        if (!isCancelled) {
          setPets([]);
          setTopTopics([]);
          setSelectedPet("");
        }
      } finally {
        if (!isCancelled) {
          setLoadingPets(false);
        }
      }
    }

    fetchData();

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

  function severityIcon(severity) {
    if (severity === "Critical" || severity === "High") return "🫀";
    if (severity === "Moderate" || severity === "Medium") return "⚠️";
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
                <div className="home-dog-icon">🐶</div>

                <div>
                  <h3>Common emergencies</h3>
                  <p>Tap one to view its guide</p>
                </div>
              </div>

              {topTopics.length > 0 ? (
                topTopics.map((topic) => (
                  <Link
                    key={topic.emergencyID}
                    to={`/guide-details/${topic.emergencyID}`}
                    className={`home-emergency-item ${
                      severityClass[topic.severity] || "amber"
                    }`}
                  >
                    <span>{severityIcon(topic.severity)}</span>
                    {topic.topicTitle} <b>›</b>
                  </Link>
                ))
              ) : (
                <>
                  <Link
                    to="/emergency-search"
                    className="home-emergency-item red"
                  >
                    <span>🫀</span> Choking / Breathing issues <b>›</b>
                  </Link>

                  <Link
                    to="/emergency-search"
                    className="home-emergency-item amber"
                  >
                    <span>💊</span> Poisoning / Toxic ingestion <b>›</b>
                  </Link>

                  <Link
                    to="/emergency-search"
                    className="home-emergency-item green"
                  >
                    <span>🌡️</span> Heatstroke / Overheating <b>›</b>
                  </Link>

                  <Link
                    to="/emergency-search"
                    className="home-emergency-item amber"
                  >
                    <span>🦴</span> Broken bone / Fracture <b>›</b>
                  </Link>
                </>
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
          {loadingPets && (
            <div className="home-pet-empty">
              Loading pet types from database...
            </div>
          )}

          {!loadingPets && pets.length === 0 && (
            <div className="home-pet-empty">
              No pet types found yet. Please add emergency topics from admin.
            </div>
          )}

          {!loadingPets &&
            pets.map(({ name, icon, count }) => (
              <button
                key={name}
                type="button"
                onClick={() => setSelectedPet(name)}
                className={`home-pet-card ${
                  selectedPet === name ? "active" : ""
                }`}
              >
                <span>{icon || "🐾"}</span>
                <h4>{name}</h4>
                <p>
                  {count} {count === 1 ? "guide" : "guides"}
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