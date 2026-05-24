import React, { useState, useEffect } from "react";
import { ScrollText } from "lucide-react";
import { motion } from "framer-motion";

type HistoryEvent = {
  year: number | string;
  text: string;
  image: string | null;
  link: string;
};

export default function HistoryCard({
  onNext,
  onPrev,
}: {
  onNext: () => void;
  onPrev?: () => void;
}) {
  const [events, setEvents] = useState<HistoryEvent[]>([]);

  useEffect(() => {
    async function fetchEvents() {
      try {
        const today = new Date();
        const month = String(today.getMonth() + 1).padStart(2, "0");
        const day = String(today.getDate()).padStart(2, "0");

        const res = await fetch(
          `https://en.wikipedia.org/api/rest_v1/feed/onthisday/events/${month}/${day}`
        );
        const data = await res.json();

        const events = data.events
          .filter((ev: any) => ev.pages?.some((p: any) => p.thumbnail))
          .sort(() => Math.random() - 0.5)
          .slice(0, 3)
          .map((ev: any) => {
            const page = ev.pages[0];
            return {
              year: ev.year,
              text: ev.text,
              image: page.thumbnail?.source || null,
              link: page.content_urls.desktop.page,
            };
          });

        setEvents(events);
      } catch (err) {
        console.error("Failed to load history events", err);
      }
    }

    fetchEvents();
  }, []);

  return (
    <section className="history-section">
      {/* ✅ hero header */}
      <div className="section-hero">
        <div className="badge history-badge">
          <ScrollText size={28} strokeWidth={2.5} />
        </div>
        <h2 className="title">
          Today in <span className="accent history-accent">History</span>
        </h2>
      </div>

      {/* ✅ bubble card wrapping events */}
      <div className="bubble-card">
        {events.length === 0 ? (
          <p>Loading…</p>
        ) : (
          events.map((ev, i) => (
            <motion.div
              key={i}
              className="event"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.5, delay: i * 0.2 }}
              style={{ marginBottom: "16px" }}
            >
              {ev.image && (
                <img
                  src={ev.image}
                  alt=""
                  style={{
                    width: "100%",
                    borderRadius: "10px",
                    marginBottom: "8px",
                  }}
                />
              )}
              <p>
                <span className="year">{ev.year}</span>
                {ev.text}{" "}
                <a href={ev.link} target="_blank" rel="noopener noreferrer">
                  Read more →
                </a>
              </p>
            </motion.div>
          ))
        )}
      </div>

      {/* ✅ nav buttons */}
      <div style={{ marginTop: 16 }}>
        <nav className="nav-buttons" aria-label="Card navigation">
          <button
            className="nav-btn primary"
            onClick={onPrev}
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
