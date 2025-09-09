import React from "react";

export default function FeelGoodFact({
  text,
  onNext,
}: { text: string; onNext: () => void }) {
  return (
    <section>
      <div className="section-hero">
        <div className="badge">✨</div>
        <h2 className="title">
          Something
          <span className="accent">Beautiful</span>
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
