import { Link } from "react-router-dom";
import { guides } from "../data/guides";

export default function TopicList() {
  return (
    <main className="topics-page">
      <section className="topics-header">
        <p className="topics-label">Emergency Topic List</p>
        <h1>Browse emergency guides</h1>
        <p>Select one topic to view the correct first-aid guide.</p>
      </section>

      <section className="topics-grid">
        {guides.map((topic) => (
          <Link
            to={`/guide-details/${topic.id}`}
            className={`topics-card ${topic.color}`}
            key={topic.id}
          >
            <span>{topic.icon}</span>
            <h3>{topic.title}</h3>
            <p>
              {topic.pet} · {topic.severity}
            </p>
            <b>View guide →</b>
          </Link>
        ))}
      </section>
    </main>
  );
}