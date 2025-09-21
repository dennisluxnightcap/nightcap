import React, { useEffect, useRef, useState } from "react";
import { motion, useAnimation, AnimatePresence } from "framer-motion";

type PatternObj = { inhale: number; hold?: number; exhale: number };
export type Breathing = {
  pattern: string | PatternObj;
  rounds: number;
  script?: string;
};

export default function Breathing({
  pattern,
  rounds = 1,
  script,
  onComplete,
}: Breathing & { onComplete?: () => void }) {
  const parsed = (() => {
    if (typeof pattern === "string") {
      const parts = pattern
        .split(/[-,\/\s]+/)
        .map((s) => Number(s))
        .filter((n) => Number.isFinite(n));
      if (parts.length >= 3)
        return { inhale: parts[0], hold: parts[1], exhale: parts[2] };
      const v = Number(parts[0]) || 5;
      return { inhale: v, hold: 0, exhale: v };
    }
    return {
      inhale: pattern.inhale ?? 5,
      hold: pattern.hold ?? 0,
      exhale: pattern.exhale ?? 5,
    };
  })();

  const controls = useAnimation();

  const [phase, setPhase] = useState<
    "getready" | "inhale" | "hold" | "exhale" | "done"
  >("getready");

  const [remainingSec, setRemainingSec] = useState<number | null>(null);
  const timerRef = useRef<number | null>(null);
  const phaseEndAtRef = useRef<number>(0);

  const clearTimer = () => {
    if (timerRef.current != null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const startCountdown = (seconds: number) => {
    const endAt = performance.now() + seconds * 1000;
    phaseEndAtRef.current = endAt;
    setRemainingSec(seconds);

    clearTimer();
    timerRef.current = window.setInterval(() => {
      const now = performance.now();
      const left = Math.max(0, (phaseEndAtRef.current - now) / 1000);
      setRemainingSec(left);
    }, 100);
  };

  useEffect(() => {
    let alive = true;
    const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

    const run = async () => {
      await controls.set({ scale: 1, ["--glow" as any]: 0 });
      setPhase("getready");
      setRemainingSec(null);

      // ✅ Longer delay before first inhale
      await sleep(3000);

      for (let r = 0; r < rounds && alive; r++) {
        // inhale
        setPhase("inhale");
        startCountdown(parsed.inhale);
        await controls.start({
          scale: 1.35,
          ["--glow" as any]: 0.9,
          transition: {
            type: "tween",
            duration: Math.max(0.05, parsed.inhale),
            ease: "easeInOut",
          },
        });
        if (!alive) break;

        // hold
        if (parsed.hold > 0.0001) {
          setPhase("hold");
          startCountdown(parsed.hold);
          await controls.start({
            ["--glow" as any]: 1,
            transition: {
              type: "tween",
              ease: "easeInOut",
              duration: parsed.hold,
            },
          });
        }
        if (!alive) break;

        // exhale
        setPhase("exhale");
        startCountdown(parsed.exhale);
        await controls.start({
          scale: 0.75,
          ["--glow" as any]: 0.18,
          transition: {
            type: "tween",
            duration: Math.max(0.05, parsed.exhale),
            ease: "easeInOut",
          },
        });
        if (!alive) break;

        await sleep(140);
      }

      if (!alive) return;

      // just switch phase – AnimatePresence will fade
      setPhase("done");
      setRemainingSec(null);

      onComplete?.();
    };

    run();
    return () => {
      alive = false;
      controls.stop();
      clearTimer();
    };
  }, [pattern, rounds]);

  const labelForPhase = {
    getready: "Get ready…",
    inhale: "Breathe in",
    hold: "Hold",
    exhale: "Breathe out",
    done: "Session complete",
  } as const;

  const countdownText =
    phase === "getready" || remainingSec == null
      ? null
      : `${Math.ceil(remainingSec)}s`;

  return (
    <section className="breathing-shell">
      <div className="breathing-hero">
        <AnimatePresence mode="wait">
          {phase !== "done" ? (
            <motion.div
              key="orb"
              className="breathing-content"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
            >
              <div className="breathing-bubble-row" aria-hidden>
                <motion.div
                  className={`breathing-bubble ${phase}`}
                  animate={controls}
                  initial={false}
                  style={{ originX: 0.5, originY: 0.5, ["--glow" as any]: 0 }}
                >
                  <div className="bubble-inner" />
                  <div className="bubble-highlight" />
                </motion.div>
              </div>

              <div className="breathing-text">
                <h3 className="breathing-label">{labelForPhase[phase]}</h3>
                <div className="breathing-sub">
                  <div className="breathing-time">{countdownText}</div>
                </div>
                {script ? <p className="breathing-script">{script}</p> : null}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="goodnight"
              className="goodnight"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 5, ease: "easeInOut" }}
            >
              <h2>Good night 🌙</h2>
              <p className="breathing-script">
                Sleep well, you’re all set for today.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
