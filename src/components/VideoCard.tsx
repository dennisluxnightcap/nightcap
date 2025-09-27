// src/components/VideoCard.tsx
import React from "react";
import Card from "./Card";
import type { Video } from "@/types";
import { PlayCircle } from "lucide-react"; // 👈 use Lucide icon instead of broken img

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
    <Card>
      <header className="section-hero">
        <div className="badge video-badge">
          <PlayCircle size={28} strokeWidth={2.5} /> {/* 👈 fixed SVG */}
        </div>
        <h2 className="title">
          Today’s <span className="accent video-accent">Video</span>
        </h2>
      </header>

      <div className="video-wrapper" style={{ marginTop: 28 }}>
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


      <div className="row" style={{ marginTop: 12 }}>
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
    </Card>
  );
}
