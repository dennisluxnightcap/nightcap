import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { motion, useAnimation, AnimatePresence } from "framer-motion";
import { recordBedtime, getBedtimeHistory } from "../utils/bedtimeTracker";
import WeatherForecast from "./WeatherForecast";
import BedtimeHistory from "./BedtimeHistory";
import ScreenTime from "../utils/screenTime";
import { recordScreenTime, getScreenTimeLogs } from "../utils/screenTimeTracker";
import ScreenTimeHistory from "./ScreenTimeHistory";
import StepCount from "../utils/stepCount";
import { recordSteps, getStepLogs } from "../utils/stepTracker";
import StepHistory from "./StepHistory";

type PatternObj = { inhale: number; hold?: number; exhale: number };
export type Breathing = {
  pattern: string | PatternObj;
  rounds: number;
  script?: string;
  why?: string;
};

export type BreathingHandle = {
  /** Stops the breathing animation immediately and jumps to the Good Night summary. */
  skip: () => void;
};

function BreathingImpl(
  { pattern, rounds = 1, script, why, onComplete }: Breathing & { onComplete?: () => void },
  ref: React.Ref<BreathingHandle>
) {
  // Parse breathing pattern
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
  const [bedtimeHistory, setBedtimeHistory] = useState<Date[]>([]);
  const [screenTimeMs, setScreenTimeMs] = useState<number | null>(null);
  const [screenPermission, setScreenPermission] = useState<boolean | null>(null);
  const [screenTimeLogs, setScreenTimeLogs] = useState(getScreenTimeLogs());
  const [stepsToday, setStepsToday] = useState<number | null>(null);
  const [stepAvailable, setStepAvailable] = useState<boolean | null>(null);
  const [stepPermission, setStepPermission] = useState<boolean | null>(null);
  const [stepLogs, setStepLogs] = useState(getStepLogs());

  const timerRef = useRef<number | null>(null);
  const phaseEndAtRef = useRef<number>(0);
  const cancelledRef = useRef(false);
  const finishedRef = useRef(false);

  const clearTimer = () => {
    if (timerRef.current != null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  // Shared by the normal end-of-session flow and by skip() — records bedtime,
  // grabs today's screen time, and reveals the Good Night summary.
  const finishSession = async () => {
    if (finishedRef.current) return;
    finishedRef.current = true;

    recordBedtime();
    setBedtimeHistory(getBedtimeHistory());

    try {
      const { granted } = await ScreenTime.hasPermission();
      setScreenPermission(granted);
      if (granted) {
        const result = await ScreenTime.getScreenTime();
        if (result.totalMs != null) {
          setScreenTimeMs(result.totalMs);
          recordScreenTime(result.totalMs);
          setScreenTimeLogs(getScreenTimeLogs());
        }
      }
    } catch {
      // silently skip if unavailable
    }

    try {
      const { available, granted } = await StepCount.hasPermission();
      setStepAvailable(available);
      setStepPermission(granted);
      if (available && granted) {
        const result = await StepCount.getTodaySteps();
        if (result.steps != null) {
          setStepsToday(result.steps);
          recordSteps(result.steps);
          setStepLogs(getStepLogs());
        }
      }
    } catch {
      // silently skip if unavailable
    }

    setPhase("done");
    setRemainingSec(null);
    onComplete?.();
  };

  const skip = () => {
    if (finishedRef.current) return;
    cancelledRef.current = true;
    controls.stop();
    clearTimer();
    void finishSession();
  };

  useImperativeHandle(ref, () => ({ skip }));

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
    cancelledRef.current = false;
    finishedRef.current = false;
    const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

    const run = async () => {
      await controls.set({ scale: 1, ["--glow" as any]: 0 });
      setPhase("getready");
      setRemainingSec(null);

      // delay before first inhale
      await sleep(3000);

      for (let r = 0; r < rounds && !cancelledRef.current; r++) {
        // inhale
        setPhase("inhale");
        startCountdown(parsed.inhale);
        await controls.start({
          scale: 1.35,
          ["--glow" as any]: 0.9,
          transition: {
            default: {
              type: "tween",
              duration: Math.max(0.05, parsed.inhale),
              ease: "easeInOut",
            },
            // Glow builds gradually, picking up a little pace toward the top of the inhale.
            ["--glow" as any]: {
              type: "tween",
              duration: Math.max(0.05, parsed.inhale),
              ease: [0.32, 0, 0.67, 0],
            },
          },
        });
        if (cancelledRef.current) break;

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
        if (cancelledRef.current) break;

        // exhale
        setPhase("exhale");
        startCountdown(parsed.exhale);
        await controls.start({
          scale: 0.75,
          ["--glow" as any]: 0.18,
          transition: {
            default: {
              type: "tween",
              duration: Math.max(0.05, parsed.exhale),
              ease: "easeInOut",
            },
            // Mirror of the inhale: glow eases away, settling gently near the bottom.
            ["--glow" as any]: {
              type: "tween",
              duration: Math.max(0.05, parsed.exhale),
              ease: [0.33, 1, 0.68, 1],
            },
          },
        });
        if (cancelledRef.current) break;

        await sleep(140);
      }

      if (cancelledRef.current) return;
      await finishSession();
    };

    run();
    return () => {
      cancelledRef.current = true;
      controls.stop();
      clearTimer();
    };
  }, [pattern, rounds]);

  // Re-check screen time permission when user returns from Settings
  useEffect(() => {
    if (phase !== "done") return;
    const handleVisible = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const { granted } = await ScreenTime.hasPermission();
        setScreenPermission(granted);
        if (granted && screenTimeMs == null) {
          const result = await ScreenTime.getScreenTime();
          if (result.totalMs != null) setScreenTimeMs(result.totalMs);
        }
      } catch {}
    };
    document.addEventListener("visibilitychange", handleVisible);
    return () => document.removeEventListener("visibilitychange", handleVisible);
  }, [phase, screenTimeMs]);

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
                {why ? (
                  <>
                    <hr className="breathing-why-divider" />
                    <p className="breathing-why">{why}</p>
                    <hr className="breathing-why-divider breathing-why-divider--after" />
                  </>
                ) : null}
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

              {/* 📱 Screen Time */}
              {screenTimeMs != null ? (
                <ScreenTimeHistory todayMs={screenTimeMs} logs={screenTimeLogs} />
              ) : screenPermission === false ? (
                <motion.div
                  className="bedtime-history"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1.0, delay: 0.4, ease: "easeOut" }}
                >
                  <p className="history-label">Screen time</p>
                  <p className="breathing-script" style={{ margin: "4px 0 10px" }}>
                    Allow access to see your daily total
                  </p>
                  <button
                    className="nav-btn primary"
                    onClick={() => ScreenTime.requestPermission()}
                  >
                    Enable
                  </button>
                </motion.div>
              ) : null}

              {/* 🌦 Weather Forecast */}
              <WeatherForecast />

              {/* 🕙 Bedtime history + trend */}
              {bedtimeHistory.length > 0 && (
                <>
                  <hr className="insight-divider" />
                  <BedtimeHistory />
                </>
              )}

              {/* 👣 Steps — side info, shown last since it's not the app's focus */}
              {stepAvailable && (
                <>
                  <hr className="insight-divider" />
                  <StepHistory
                    steps={stepsToday}
                    granted={stepPermission}
                    logs={stepLogs}
                    onRequestPermission={async () => {
                      const { granted } = await StepCount.requestPermission();
                      setStepPermission(granted);
                    }}
                  />
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

const Breathing = forwardRef(BreathingImpl);
export default Breathing;
