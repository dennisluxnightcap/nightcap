// src/components/BrightSpot.tsx
import React, { useState } from "react";
import type { Brightspot } from "../types";
import { motion } from "framer-motion";

import "../styles.css";

export default function BrightSpot({
  spot,
  onNext,
}: {
  spot: Brightspot;
  onNext: () => void;
}) {
  const [open, setOpen] = useState(false);

  const handlePrev = () => setOpen(false);
  const handleNext = () => {
    setOpen(false);
    onNext();
  };

  return (
    <div className="brightspot-wrapper">
      {/* Teaser button before fullscreen opens */}
      {!open && (
        <button className="brightspot-teaser" onClick={() => setOpen(true)}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            width="18"
            height="18"
            style={{ marginRight: "8px" }}
          >
            <path
              fill="#8C5E0A"
              d="M12 2l1.8 4.8L18 8.6l-4.2 1.8L12 15.2l-1.8-4.8L6 8.6l4.2-1.8L12 2zM4 12l1.2 3 3 1.2-3 1.2L4 20l-1.2-3-3-1.2 3-1.2L4 12zm16 0l1.2 3 3 1.2-3 1.2L20 20l-1.2-3-3-1.2 3-1.2L20 12z"
            />
          </svg>
          Let’s brighten things up
        </button>
      )}

      {/* Fullscreen takeover */}
      {open && (
        <div className="brightspot-fullscreen">
          {/* Section hero ABOVE the content */}
          <div className="section-hero brightspot-hero">
            <div className="badge brightspot-badge">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="brightspot-icon"
              >
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            </div>
            <h2 className="title">
              Something <span className="accent brightspot-accent">Positive</span>
            </h2>
          </div>

          {/* Card container */}
          <div className="brightspot-content">
            {spot.image && (
              <div className="brightspot-image-wrapper">
                <motion.img
                  src={spot.image}
                  alt={spot.text}
                  className="brightspot-image"
                  initial={{ scale: 1, y: 0 }}
                  animate={{ scale: 1.2, y: 40 }}
                  transition={{
                    duration: 30,
                    ease: "linear",
                    repeat: Infinity,
                    repeatType: "reverse",
                  }}
                />
              </div>
            )}

            <p className="brightspot-text">{spot.text}</p>

            {spot.source && (
              <p className="brightspot-source">
                {spot.source} {spot.year ? `(${spot.year})` : ""}
              </p>
            )}
          </div>

          {/* Navigation buttons */}
          <div className="nav-buttons">
            <button className="nav-btn primary" onClick={handlePrev}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path
                  d="M15 6l-6 6 6 6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            <button className="nav-btn primary pulse" onClick={handleNext}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path
                  d="M9 6l6 6-6 6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
