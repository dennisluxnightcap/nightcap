// src/components/BrightSpot.tsx
import React, { useState } from "react";
import type { Brightspot } from "../types";
import "../styles.css";

export default function BrightSpot({
  spot,
  onNext,
}: {
  spot: Brightspot;
  onNext: () => void;
}) {
  const [open, setOpen] = useState(false);

  // Back arrow → just close BrightSpot
  const handlePrev = () => setOpen(false);

  // Forward arrow → close BrightSpot and advance
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
          <div className="brightspot-content">
            <div className="brightspot-badge">🌞</div>
            {spot.image && (
              <img src={spot.image} alt={spot.text} className="brightspot-image" />
            )}
            <p className="brightspot-text">{spot.text}</p>
            {spot.source && (
              <p className="brightspot-source">
                Source: {spot.source} {spot.year ? `(${spot.year})` : ""}
              </p>
            )}
          </div>

          {/* Navigation buttons */}
          <div className="nav-buttons">
            {/* Left: back to DailySummary (close fullscreen) */}
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

            {/* Right: advance to FeelGoodFact */}
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
