// App.tsx
import { useEffect, useState } from "react";
import { getDaily } from "./utils/getDaily";
import DailySummary from "./components/DailySummary";
import type { Daily } from "./types";
import Card from "./components/Card";
import Breathing from "./components/Breathing";
import FeelGoodFact from "./components/FeelGoodFact";
import LearnFact from "./components/LearnFact";
import Story from "./components/Story";
import HistoryCard from "./components/HistoryCard";
import MoodSlider from "./components/MoodSlider"; // ✅ new import
import { motion, AnimatePresence } from "framer-motion";

// ✅ Steps (Mood added before Breathe)
const steps = ["Summary", "Feel-good", "Learn", "History", "Story", "Mood", "Breathe"] as const;
type Step = (typeof steps)[number];

export default function App() {
  const [daily, setDaily] = useState<Daily | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [direction, setDirection] = useState<"next" | "prev">("next");
  const step: Step = steps[stepIndex];

  useEffect(() => {
    getDaily().then(setDaily);
  }, []);

  if (!daily) return <div className="shell">Loading…</div>;

  const next = () => {
    setDirection("next");
    setStepIndex((i) => Math.min(i + 1, steps.length - 1));
  };

  const prev = () => {
    setDirection("prev");
    setStepIndex((i) => Math.max(i - 1, 0));
  };

  const restart = () => setStepIndex(0);
  const maybePrev = stepIndex > 0 ? prev : undefined;

  return (
    <main className="shell">
      <header className="top"></header>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          className="motion-page"
          initial={{ opacity: 0, x: 120 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -120 }}
          transition={{ duration: 1.2, ease: "easeInOut" }}
        >
          {step === "Summary" && (
            <div>
              <DailySummary />
              <div style={{ marginTop: 16 }}>
                <nav
                  className="nav-buttons"
                  aria-label="Card navigation"
                  style={{ justifyContent: "center" }}
                >
                  <button
                    className="nav-btn primary pulse"
                    onClick={next}
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
            </div>
          )}

          {step === "Feel-good" && (
            <FeelGoodFact
              text={daily.feelGood.text}
              image={daily.feelGood.image}
              onNext={next}
              onPrev={maybePrev}
            />
          )}

          {step === "Learn" && (
            <LearnFact
              text={daily.learn.text}
              image={daily.learn.image}
              onNext={next}
              onPrev={maybePrev}
            />
          )}

          {step === "History" && <HistoryCard onNext={next} onPrev={maybePrev} />}

          {step === "Story" && (
            <Story
              text={daily.story.text}
              image={daily.story.image}
              onNext={next}
              onPrev={maybePrev}
            />
          )}

          {step === "Mood" && (
  <Card>
    <MoodSlider onComplete={next} />
    <div className="row" style={{ marginTop: 12 }}>
      <nav className="nav-buttons" aria-label="Mood navigation">
        <button
          className="nav-btn primary"
          onClick={prev}
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
        <button
          className="nav-btn primary pulse"   // ✅ added pulse here
          onClick={next}
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
  </Card>
)}


          {step === "Breathe" && (
            <Card>
              <Breathing key="breathing-session" {...daily.breathing} />
              <div className="row" style={{ marginTop: 12 }}>
                <nav className="nav-buttons" aria-label="Breathing navigation">
                  <button
                    className="nav-btn primary"
                    onClick={prev}
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
                  <button
                    className="nav-btn primary"
                    onClick={restart}
                    aria-label="Restart"
                    title="Restart"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      aria-hidden
                    >
                      <path
                        d="M21 12a9 9 0 1 0-3.4 6.8"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M21 3v6h-6"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </nav>
              </div>
            </Card>
          )}
        </motion.div>
      </AnimatePresence>
    </main>
  );
}
