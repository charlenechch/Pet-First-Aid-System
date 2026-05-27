import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL;

export default function Home() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [selectedPet, setSelectedPet] = useState("Dog");
  const [pets, setPets] = useState([]);
  const [topTopics, setTopTopics] = useState([]);

  // Severity → colour class mapping
  const severityClass = { Critical: "red", Moderate: "amber", Mild: "green" };

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`${API_URL}/api/emergency-topics`);
        const data = await res.json();
        const topics = data.topics || [];

        // Build pet list with real guide counts
        const petMap = {};
        topics.forEach((t) => {
          if (!petMap[t.petName]) {
            petMap[t.petName] = { name: t.petName, icon: t.icon || "🐾", count: 0 };
          }
          petMap[t.petName].count++;
        });
        const petOrder = ["Dog", "Cat", "Rabbit", "Bird"];
        const sortedPets = [
          ...petOrder.filter((n) => petMap[n]).map((n) => petMap[n]),
          ...Object.values(petMap).filter((p) => !petOrder.includes(p.name)),
        ];
        setPets(sortedPets);

        // Top 4 Critical/Moderate topics for emergency cards
        const top = topics
          .filter((t) => t.severity === "Critical" || t.severity === "Moderate")
          .slice(0, 4);
        setTopTopics(top);
      } catch {
        // fallback: leave empty, static links still work
      }
    }
    fetchData();
  }, []);

  const goSearch = () => {
    navigate(search.trim() ? `/emergency-search?keyword=${search.trim()}` : "/emergency-search");
  };

  // Severity → emoji
  function severityIcon(severity) {
    if (severity === "Critical") return "🫀";
    if (severity === "Moderate") return "⚠️";
    return "🌿";
  }

  return (
    <main className="home-page">

      {/* ── HERO ── */}
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
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") goSearch(); }}
                placeholder="Search e.g. choking, poison, bleeding..."
              />
              <button type="button" onClick={goSearch}>Search</button>
            </div>

            <div className="home-buttons">
              <Link to="/emergency-search" className="home-btn-fill">🚨 Start Emergency Search</Link>
              <Link to="/quiz" className="home-btn-outline">Take Quiz</Link>
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

              {topTopics.length > 0 ? topTopics.map((topic) => (
                <Link
                  key={topic.emergencyID}
                  to={`/guide-details/${topic.emergencyID}`}
                  className={`home-emergency-item ${severityClass[topic.severity] || "amber"}`}
                >
                  <span>{severityIcon(topic.severity)}</span>
                  {topic.topicTitle} <b>›</b>
                </Link>
              )) : (
                // Static fallback while loading
                <>
                  <Link to="/emergency-search" className="home-emergency-item red"><span>🫀</span> Choking / Breathing issues <b>›</b></Link>
                  <Link to="/emergency-search" className="home-emergency-item amber"><span>💊</span> Poisoning / Toxic ingestion <b>›</b></Link>
                  <Link to="/emergency-search" className="home-emergency-item green"><span>🌡️</span> Heatstroke / Overheating <b>›</b></Link>
                  <Link to="/emergency-search" className="home-emergency-item amber"><span>🦴</span> Broken bone / Fracture <b>›</b></Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── PET SECTION ── */}
      <section className="home-pet-section">
        <p className="home-section-label">Select your pet</p>
        <h2>What pet do you have?</h2>
        <p>Get emergency guides tailored to your pet's species.</p>

        <div className="home-pet-grid">
          {pets.map(({ name, icon, count }) => (
            <button
              key={name}
              onClick={() => setSelectedPet(name)}
              className={`home-pet-card ${selectedPet === name ? "active" : ""}`}
            >
              <span>{icon}</span>
              <h4>{name}</h4>
              <p>{count} {count === 1 ? "guide" : "guides"}</p>
            </button>
          ))}
        </div>

        <div className="home-pet-browse">
          <Link to={`/emergency-search?pet=${selectedPet}`} className="home-pet-browse-btn">
            Browse {selectedPet} Guides →
          </Link>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="home-feature-section">
        <p className="home-section-label">Why PawGuard</p>
        <h2>Everything you need in an emergency</h2>
        <p>Calm, clear, and fast — designed for the moments that matter most.</p>

        <div className="home-feature-grid">
          <div className="home-feature-card sage-border">
            <span>📋</span>
            <h3>Step-by-step first-aid</h3>
            <p>Clear numbered instructions with veterinary guidance so you always know the next right action.</p>
            <Link to="/emergency-search" className="home-feature-link">Browse guides →</Link>
          </div>

          <div className="home-feature-card red-border">
            <span>🧠</span>
            <h3>Quiz & test yourself</h3>
            <p>Test your pet first-aid knowledge with interactive quizzes and track your improvement over time.</p>
            <Link to="/quiz" className="home-feature-link">Start a quiz →</Link>
          </div>
        </div>
      </section>

    </main>
  );
}