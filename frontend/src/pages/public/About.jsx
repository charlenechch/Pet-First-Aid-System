import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL;

export default function About() {
  const [stats, setStats] = useState({ guides: "...", species: "...", users: "...", positiveFeedbackPct: "..." });

  useEffect(() => {
    fetch(`${API_URL}/api/stats`)
      .then((r) => r.json())
      .then((data) => {
        setStats({
          guides: data.guides ?? "—",
          species: data.species ?? "—",
          users: data.users ?? "—",
          positiveFeedbackPct: data.positiveFeedbackPct ?? "—",
        });
      })
      .catch(() => {
        setStats({ guides: "100+", species: "5+", users: "12k+", positiveFeedbackPct: "98" });
      });
  }, []);

  const statItems = [
    { n: `${stats.guides}+`,               label: "Guides published"  },
    { n: `${stats.species}+`,              label: "Species covered"   },
    { n: `${stats.users}+`,                label: "Pet owners helped" },
    { n: `${stats.positiveFeedbackPct}%`,  label: "Positive feedback" },
  ];

  return (
    <main className="about-page">

      {/* HERO */}
      <section className="about-hero">
        <div className="about-hero-content">
          <span className="about-badge">About PawGuard</span>
          <h1>Helping pet owners act fast, stay calm</h1>
          <p>
            PawGuard was built to help pet owners handle emergency situations
            with clear, calm, and trusted first-aid guidance — anytime, anywhere.
          </p>
          <div className="about-hero-pets">
            {["🐶", "🐱", "🐰", "🐦"].map((pet) => (
              <span key={pet} className="about-hero-pet">{pet}</span>
            ))}
          </div>
        </div>
      </section>

      {/* STATS BAR */}
      <section className="about-stats-bar">
        {statItems.map(({ n, label }) => (
          <div key={label} className="about-stats-item">
            <h3>{n}</h3>
            <p>{label}</p>
          </div>
        ))}
      </section>

      {/* MISSION */}
      <section className="about-mission">
        <div className="about-mission-inner">
          <div className="about-mission-left">
            <p className="about-label">Our mission</p>
            <h2>Why we built this</h2>
            <p>
              Every year, many pets suffer because owners do not know what to do
              during the first few minutes of an emergency. PawGuard helps pet
              owners quickly find emergency guides, first-aid steps, and trusted
              veterinary advice.
            </p>
            <p>
              Our guides are written in simple language so anyone can understand
              and follow them during stressful moments — no medical background
              required.
            </p>
            <div className="about-quote">
              <div className="about-quote-mark">"</div>
              <p>The best time to learn pet first-aid is before you need it.</p>
              <span>— Dr. Aisha Noor, DVM</span>
            </div>
          </div>

          <div className="about-mission-right">
            {[
              { icon: "🔍", title: "Find guides instantly",   desc: "Search by pet type, severity, or keyword — results in seconds." },
              { icon: "📋", title: "Step-by-step clarity",    desc: "Each guide breaks down complex procedures into simple numbered steps." },
              { icon: "🩺", title: "Vet-backed advice",       desc: "Every guide includes professional veterinary guidance notes." },
              { icon: "📱", title: "Works everywhere",        desc: "Optimised for mobile so you can access guides in any emergency." },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="about-feature-item">
                <div className="about-feature-icon">{icon}</div>
                <div><h4>{title}</h4><p>{desc}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DISCLAIMER */}
      <section className="about-disclaimer-section">
        <div className="about-disclaimer-card">
          <div className="about-disclaimer-left">
            <div className="about-disclaimer-icon">⚠️</div>
          </div>
          <div className="about-disclaimer-right">
            <h3>Important First-Aid Disclaimer</h3>
            <p>
              PawGuard provides general pet first-aid information for educational
              purposes only. It is <strong>not a substitute</strong> for
              professional veterinary care. Always contact your veterinarian or
              emergency animal clinic during a pet emergency.
            </p>
            <div className="about-disclaimer-tags">
              <span>🏥 Always see a vet</span>
              <span>📞 Call before acting</span>
              <span>📚 Educational use only</span>
            </div>
          </div>
        </div>
      </section>

      {/* TEAM */}
      <section className="about-team-section">
        <div className="about-team-header">
          <p className="about-label">Our team</p>
          <h2>Built with care</h2>
          <p>A small team passionate about pet welfare and accessible education.</p>
        </div>
        <div className="about-team-grid">
          {[
            { icon: "👩‍⚕️", name: "Dr. Aisha Noor", role: "Veterinary Advisor", desc: "DVM with 12 years in emergency animal care.",       color: "green"  },
            { icon: "👨‍💻", name: "Liam Chen",       role: "Lead Developer",    desc: "Full-stack engineer focused on health tech.",         color: "orange" },
            { icon: "👩‍🎨", name: "Sara Osman",      role: "UX Designer",       desc: "Designing clear, calm interfaces since 2018.",        color: "red"    },
          ].map(({ icon, name, role, desc, color }) => (
            <div key={name} className={`about-team-card about-team-${color}`}>
              <div className={`about-team-icon ${color}`}>{icon}</div>
              <h3>{name}</h3>
              <p className="about-team-role">{role}</p>
              <p className="about-team-desc">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA BANNER */}
      <section className="about-cta">
        <div className="about-cta-card">
          <div className="about-cta-icon">🐾</div>
          <h2>Ready to be prepared?</h2>
          <p>Browse our emergency guides and take a quiz to test your knowledge.</p>
          <div className="about-cta-btns">
            <Link to="/emergency-search" className="about-cta-fill">Browse Guides →</Link>
            <Link to="/quiz" className="about-cta-outline">Take a Quiz</Link>
          </div>
        </div>
      </section>

    </main>
  );
}