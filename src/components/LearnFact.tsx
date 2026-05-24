import React from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function LearnFact({
  text,
  sub,
  image,
  onNext,
  onPrev,
}: { 
  text: string;
  sub?: string; // ✅ added
  image?: string;
  onNext: () => void;
  onPrev?: () => void;
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
        <AnimatePresence mode="wait">
          {image && (
            <motion.img
              key={image}
              src={image}
              alt={text}
              className="fact-image"
              initial={{ opacity: 0, scale: 1.05, y: 20 }}
              animate={{
                opacity: 1,
                scale: [1, 1.02, 1],
                y: [0, -4, 0],
              }}
              transition={{
                opacity: { duration: 1.4, ease: "easeOut" },
                scale: { duration: 6, ease: "easeInOut", repeat: Infinity },
                y: { duration: 6, ease: "easeInOut", repeat: Infinity },
              }}
            />
          )}

          <motion.div
            key={text}
            className="fact-block"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{
              duration: 1.8,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            <p className="fact-main">{text}</p>

            {sub && (
              <>
                <div className="fact-divider" />
                <motion.p
                  className="fact-sub"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 1.0, ease: "easeOut" }}
                >
                  {sub}
                </motion.p>
              </>
            )}
          </motion.div>
        </AnimatePresence>
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
