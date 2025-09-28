// src/components/VideoCard.tsx
import React from "react";
import type { Video } from "@/types";
import { PlayCircle } from "lucide-react";

export default function VideoCard({
  video,
  onNext,
  onPrev,
}: {
  video: Video;
  onNext?: () => void;
  onPrev?: () => void;
}) {
  return (
    <section className="video-section">
      {/* --- Hero (outside bubble card) --- */}
      <header className="section-hero">
        <div className="badge video-badge">
          <PlayCircle size={28} strokeWidth={2.5} />
        </div>
        <h2 className="title">
          Tonight’s <span className="accent video-accent">Watch</span>
        </h2>
      </header>

      {/* --- Bubble card with video content --- */}
      <div className="bubble-card">
        <div className="video-wrapper">
          <div className="video-frame">
            <iframe
              src={video.url}
              width="100%"
              height="220"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={video.title}
            />
          </div>
          <p className="video-caption">
            {video.title}
            {video.source && (
              <>
                {" "}
                – {video.source}
                {video.year ? `, ${video.year}` : ""}
              </>
            )}
          </p>
        </div>
      </div>

      {/* --- Nav buttons --- */}
      <div style={{ marginTop: 16 }}>
        <nav className="nav-buttons" aria-label="Video navigation">
          {onPrev && (
            <button
              className="nav-btn primary"
              onClick={onPrev}
              aria-label="Back"
              title="Back"
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
          )}
          {onNext && (
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
          )}
        </nav>
      </div>
    </section>
  );
}
