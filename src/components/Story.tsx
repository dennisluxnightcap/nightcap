import { BookOpen } from "lucide-react";
import { motion } from "framer-motion";

export default function Story({
  text,
  onNext,
  onPrev,
}: { text: string; onNext: () => void; onPrev?: () => void }) {
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
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
              <path d="M8 5l8 7-8 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </nav>
      </div>
    </section>
  );
}
