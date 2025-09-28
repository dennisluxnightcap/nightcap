import { BookOpen } from "lucide-react";
import { motion } from "framer-motion";

export default function Story({
  text,
  image,
  onNext,
  onPrev,
}: {
  text: string;
  image?: string;
  onNext: () => void;
  onPrev?: () => void;
}) {
  return (
    <section className="story-section">
      <div className="section-hero">
        <div className="badge story-badge">
          <BookOpen size={28} strokeWidth={2.5} />
        </div>
        <h2 className="title">
          Short <span className="accent story-accent">Story</span>
        </h2>
      </div>

      <div className="story-bg">
        {image && (
          <motion.div
            className="story-bg-img"
            style={{ backgroundImage: `url(${image})` }}
            initial={{ scale: 1.05, y: 0 }}
            animate={{ scale: 1.2, y: -80 }} // 👈 zoom + drift upward (reveals bottom of image)
            transition={{ duration: 20, ease: "linear", repeat: Infinity }}
          />
        )}

        <motion.p
          className="story-text"
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
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
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
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
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
