import React from "react";

const icons = ["🌍", "📈", "❤️", "✨", "🧠", "📰"];

interface DailySummaryProps {
  items: string[];
}

const DailySummary: React.FC<DailySummaryProps> = ({ items }) => {
  return (
    <section>
      <header className="section-hero summary-hero">
        <div className="badge">📅</div>
        <h2 className="title">
          A look back at <span className="accent">today</span>
        </h2>
      </header>

      {items.length > 0 ? (
        <div className="facts">
          {items.map((text, i) => (
            <div key={i} className={`fact-card glow variant-${i}`}>
              <span className={`icon ${i % 3 === 0 ? "blue" : i % 3 === 1 ? "green" : "pink"}`}>
                {icons[i % icons.length]}
              </span>
              <p>{text}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="facts">
          <div className="fact-card glow">
            <span className="icon">📝</span>
            <p>
              Put items under <code>"summary"</code> in{" "}
              <code>/public/content/daily/default.json</code>.
            </p>
          </div>
        </div>
      )}
    </section>
  );
};

export default DailySummary;
