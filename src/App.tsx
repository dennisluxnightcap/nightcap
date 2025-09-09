import { useEffect, useState } from "react";
import { getDaily } from "./utils/getDaily";
import DailySummary from "./components/DailySummary";
import type { Daily } from "./types";
import Card from "./components/Card";
import Breathing from "./components/Breathing";
import FeelGoodFact from "./components/FeelGoodFact";
import LearnFact from "./components/LearnFact";
import { motion, AnimatePresence } from "framer-motion";

const steps = ["Summary", "Feel-good", "Learn", "Breathe"] as const;
type Step = (typeof steps)[number];

export default function App() {
  const [daily, setDaily] = useState<Daily | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const step: Step = steps[stepIndex];

  useEffect(() => {
    getDaily().then(setDaily);
  }, []);

  if (!daily) return <div className="shell">Loading…</div>;

  const next = () => setStepIndex((i) => Math.min(i + 1, steps.length - 1));
  const restart = () => setStepIndex(0);

  return (
    <main className="shell">
      <header className="top">
        <h1>Nightcap</h1>
        <div className="pill">~ 1 minute</div>
      </header>

      {/* 👇 Animate step changes */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.5 }}
        >
          {step === "Summary" && (
            <div>
              <DailySummary items={daily.summary} />
              <div style={{ marginTop: 16 }}>
                <button className="btn" onClick={next}>Next</button>
              </div>
            </div>
          )}

          {step === "Feel-good" && (
            <FeelGoodFact text={daily.feelGood} onNext={next} />
          )}

          {step === "Learn" && (
            <LearnFact text={daily.learn} onNext={next} />
          )}

          {step === "Breathe" && (
            <Card title="Breathing">
              <Breathing {...daily.breathing} />
              <div className="row" style={{ marginTop: 12 }}>
                <button className="btn" onClick={restart}>Restart</button>
              </div>
            </Card>
          )}
        </motion.div>
      </AnimatePresence>

      <footer className="foot">
        <small>
          <a href="mailto:feedback@nightcap.example">Feedback</a> •{" "}
          <a href="/privacy">Privacy</a>
        </small>
      </footer>
    </main>
  );
}
