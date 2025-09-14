import React from "react";
import { motion } from "framer-motion";

export default function FeelGoodFact({
  text,
  onNext,
  onPrev,
}: { text: string; onNext: () => void; onPrev?: () => void }) {
  return (
    <section>
      <div className="section-hero">
        <div className="badge">
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
    <path
      d="M21 8.25c0-2.485-2.015-4.5-4.5-4.5-1.74 0-3.244.985-4 2.425A4.5 4.5 0 0 0 3 8.25c0 6 9 10.5 9 10.5s9-4.5 9-10.5Z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
</div>

        <h2 className="title">
          Something <span className="accent">Beautiful</span>
        </h2>
      </div>

      <div className="bubble-card">
 <motion.p
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 2.5, ease: "easeOut", delay: 0.3 }}
>
  {text}
</motion.p>
</div>


      <div style={{ marginTop: 16 }}>
        <nav className="nav-buttons" aria-label="Card navigation">
          <button
            className="nav-btn primary"
            onClick={onPrev ? onPrev : undefined}
            aria-label="Back"
            disabled={!onPrev}
            title={onPrev ? "Back" : ""}
          >
            {/* Back SVG (thin) */}
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
              <path d="M16 19L8 12l8-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          <button
            className="nav-btn primary pulse"
            onClick={onNext}
            aria-label="Next"
            title="Next"
          >
            {/* Forward SVG (thin) */}
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
              <path d="M8 5l8 7-8 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </nav>
      </div>
    </section>
  );
}
