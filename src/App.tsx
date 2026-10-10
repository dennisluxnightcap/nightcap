// App.tsx
import { useEffect, useRef, useState } from "react";
import { getDaily } from "./utils/getDaily";
import DailySummary from "./components/DailySummary";
import type { Daily } from "./types";
import Card from "./components/Card";
import Breathing, { type BreathingHandle } from "./components/Breathing";
import FeelGoodFact from "./components/FeelGoodFact";
import LearnFact from "./components/LearnFact";
import Story from "./components/Story";
import HistoryCard from "./components/HistoryCard";
import MoodSlider from "./components/MoodSlider";
import VideoCard from "./components/VideoCard";
import CardStack from "./components/CardStack";
import { motion, AnimatePresence } from "framer-motion";
import Onboarding from "./components/Onboarding";
import { SplashScreen } from "@capacitor/splash-screen";
import { RotateCw } from "lucide-react";

const steps = [
  "Summary",
  "Facts",
  "History",
  "VideoStory",
  "Mood",
  "Breathe",
] as const;
type Step = (typeof steps)[number];

// TEMP: seed a fake "yesterday" step entry so the trend chart has 2+ days to
// render for preview purposes. Remove after checking the chart looks right.
(function seedFakeStepHistory() {
  if (typeof window === "undefined") return;
  const KEY = "nightcapSteps_v1";
  try {
    const raw = localStorage.getItem(KEY);
    const logs = raw ? JSON.parse(raw) : [];
    if (logs.length >= 2) return;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const y = yesterday.getFullYear();
    const m = String(yesterday.getMonth() + 1).padStart(2, "0");
    const d = String(yesterday.getDate()).padStart(2, "0");
    logs.push({ date: `${y}-${m}-${d}`, steps: 6421 });
    localStorage.setItem(KEY, JSON.stringify(logs));
  } catch {
    // ignore
  }
})();

export default function App() {
  const [daily, setDaily] = useState<Daily | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [direction, setDirection] = useState<"next" | "prev">("next");
  const [showOnboarding, setShowOnboarding] = useState(true); // DEV: always show
  const [breathingDone, setBreathingDone] = useState(false);
  const step: Step = steps[stepIndex];
  const breathingRef = useRef<BreathingHandle>(null);

  // Reset the Good Night state whenever we leave/re-enter the Breathe step,
  // so the redo button doesn't linger after restarting from the first card.
  useEffect(() => {
    setBreathingDone(false);
  }, [step]);

  useEffect(() => {
    getDaily().then(setDaily);
  }, []);

  // Hide the native splash screen only once our own matching dark screen is
  // already on-screen, so there's one clean handoff instead of the OS dismissing
  // the splash on its own timing and racing our content's own load/animation.
  useEffect(() => {
    SplashScreen.hide().catch(() => {});
  }, []);

  // ✅ Reset scroll immediately on step change
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  }, [stepIndex]);

  if (!daily) return <div className="onboarding-overlay" />;

  const next = () => {
    setDirection("next");
    setStepIndex((i) => Math.min(i + 1, steps.length - 1));
  };

  const prev = () => {
    setDirection("prev");
    setStepIndex((i) => Math.max(i - 1, 0));
  };

  const maybePrev = stepIndex > 0 ? prev : undefined;

  const restart = () => {
    setDirection("prev");
    setStepIndex(0);
  };

  const handleOnboardingDone = () => {
    localStorage.setItem("nightcap_welcomed", "1");
    setShowOnboarding(false);
  };

  return (
    <main className="shell">
      <AnimatePresence>
        {showOnboarding && (
          <Onboarding key="onboarding" onDone={handleOnboardingDone} />
        )}
      </AnimatePresence>
      <header className="top"></header>

      <AnimatePresence
        mode="wait"
        // ✅ Run scroll reset again once exit animation completes
        onExitComplete={() => {
          window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
        }}
      >
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
              <DailySummary onNext={next} spot={daily.brightspot} />
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

          {step === "Facts" && (
            <CardStack
              onNext={next}
              onPrev={maybePrev}
              cards={[
                <FeelGoodFact
                  key="feel-good"
                  text={daily.feelGood.text}
                  sub={daily.feelGood.sub}
                  image={daily.feelGood.image}
                  hideNav
                />,
                <LearnFact
                  key="learn"
                  text={daily.learn.text}
                  sub={daily.learn.sub}
                  image={daily.learn.image}
                  hideNav
                />,
              ]}
            />
          )}

          {step === "History" && (
            <HistoryCard onNext={next} onPrev={maybePrev} />
          )}

          {step === "VideoStory" && (
            <CardStack
              onNext={next}
              onPrev={maybePrev}
              cards={[
                <VideoCard key="video" video={daily.video} hideNav />,
                <Story
                  key="story"
                  text={daily.story.text}
                  image={daily.story.image}
                  hideNav
                />,
              ]}
            />
          )}

          {step === "Mood" && (
            <MoodSlider onNext={next} onPrev={maybePrev} />
          )}

          {step === "Breathe" && (
            <Card>
              <Breathing
                ref={breathingRef}
                key="breathing-session"
                {...daily.breathing}
                onComplete={() => setBreathingDone(true)}
              />
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
                  {breathingDone ? (
                    <button
                      className="nav-btn primary"
                      onClick={restart}
                      aria-label="Restart"
                      title="Restart"
                    >
                      <RotateCw strokeWidth={1.8} />
                    </button>
                  ) : (
                    <button
                      className="nav-btn primary"
                      onClick={() => breathingRef.current?.skip()}
                      aria-label="Skip"
                      title="Skip"
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
          )}
        </motion.div>
      </AnimatePresence>
    </main>
  );
}
