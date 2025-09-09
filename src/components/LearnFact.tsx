import React from "react";

export default function LearnFact({
  text,
  onNext,
}: { text: string; onNext: () => void }) {
  return (
    <section>
      <div className="section-hero">
        <div className="badge">🧠</div>
        <h2 className="title">
          Learn
          <span className="accent">Something New</span>
        </h2>
      </div>

      <div className="bubble-card">
        <p>{text}</p>
      </div>

      <div style={{ textAlign: "center", marginTop: 12 }}>
        <button className="btn" onClick={onNext}>Next</button>
      </div>
    </section>
  );
}
