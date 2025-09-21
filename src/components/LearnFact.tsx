import React from "react";
import { motion } from "framer-motion";

export default function LearnFact({
  text,
  image,
  onNext,
  onPrev,
}: { 
  text: string; 
  image?: string; 
  onNext: () => void; 
  onPrev?: () => void 
}) {
  return (
    <section className="learn">
      <div className="section-hero">
        <div className="badge">
          {/* Lightbulb icon for learning */}
          <svg viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M9 18h6m-5 3h4M12 2a7 7 0 0 0-4 12.9V17h8v-2.1A7 7 0 0 0 12 2Z"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <h2 className="title">
          Learn <span className="accent">Something New</span>
        </h2>
      </div>

      <div className="bubble-card fact-content">
        {image && (
          <motion.img
            src={image}
            alt={text}
            className="fact-image"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />
        )}
        <motion.p
          className="fact-text"
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
            <svg
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden
            >
              <path
                d="M16 19L8 12l8-7"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          <button
            className="nav-btn primary pulse"
            onClick={onNext}
            aria-label="Next"
            title="Next"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden
            >
              <path
                d="M8 5l8 7-8 7"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </nav>
      </div>
    </section>
  );
}
