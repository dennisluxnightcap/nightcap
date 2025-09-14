import React, { useEffect, useRef, useState } from "react";
import { motion, useAnimation } from "framer-motion";

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
      if (parts.length >= 3) return { inhale: parts[0], hold: parts[1], exhale: parts[2] };
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

  const [phase, setPhase] = useState<"idle" | "inhale" | "hold" | "exhale">("idle");

  // Countdown
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
      // start neutral and also ensure CSS var --glow exists (0)
      await controls.set({ scale: 1, opacity: 1, ["--glow" as any]: 0 });
      setPhase("idle");
      setRemainingSec(null);

      for (let r = 0; r < rounds && alive; r++) {
        // INHALE
        setPhase("inhale");
        startCountdown(parsed.inhale);
        await controls.start({
          scale: 1.35,
          opacity: 1,
          ["--glow" as any]: 0.9,
          transition: { type: "tween", duration: Math.max(0.05, parsed.inhale), ease: "easeInOut" },
        });
        if (!alive) break;

        // HOLD
        if (parsed.hold > 0.0001) {
          setPhase("hold");
          startCountdown(parsed.hold);
          await controls.start({
            opacity: [1, 0.96, 1],
            ["--glow" as any]: 1,
            transition: {
              type: "tween",
              ease: "easeInOut",
              duration: parsed.hold,
              times: [0, 0.5, 1],
            },
          });
          await controls.set({ opacity: 1, ["--glow" as any]: 1 });
        }

        if (!alive) break;

        // EXHALE
        setPhase("exhale");
        startCountdown(parsed.exhale);
        await controls.start({
          scale: 0.75,
          ["--glow" as any]: 0.18,
          transition: { type: "tween", duration: Math.max(0.05, parsed.exhale), ease: "easeInOut" },
        });
        if (!alive) break;

        // brief dwell at end of exhale; keep timer visible (will be 0) to avoid flicker
        await sleep(140);
      }

      if (!alive) return;
      setPhase("idle");
      setRemainingSec(null);
      await controls.start({ scale: 1, opacity: 1, ["--glow" as any]: 0, transition: { type: "tween", duration: 0.3 } });
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
    idle: "Breathe",
    inhale: "Breathe in",
    hold: "Hold",
    exhale: "Breathe out",
  } as const;

  const countdownText =
    remainingSec == null ? null : `${Math.ceil(remainingSec)}s`;

  return (
    <section className="breathing-shell">
      {/* REMOVE breathing-card to avoid nested boxes */}
      <div className="breathing-hero">
        <div className="breathing-bubble-row" aria-hidden>
          <motion.div
            className={`breathing-bubble ${phase}`}  /* optional: adds .inhale/.hold/.exhale */
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
            <div className="breathing-time">
              {countdownText ??
                (phase === "idle"
                  ? `${parsed.inhale}s / ${parsed.exhale}s`
                  : null)}
            </div>
          </div>
          {script ? <p className="breathing-script">{script}</p> : null}
        </div>
      </div>
    </section>
  );
}
