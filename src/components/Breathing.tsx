import { useEffect, useMemo, useRef, useState } from "react";
import type { Breathing as BreathingType } from "../types";

function parse(p: string): [number, number, number] {
  const [i, h, o] = p.split("-").map(Number);
  return [i || 4, h || 7, o || 8];
}

export default function Breathing({ pattern, rounds, script }: BreathingType) {
  const [phase, setPhase] = useState<"in" | "hold" | "out">("in");
  const [count, setCount] = useState(0);
  const [round, setRound] = useState(1);
  const timer = useRef<number | null>(null);
  const [IN, HOLD, OUT] = useMemo(() => parse(pattern), [pattern]);

  useEffect(() => {
    timer.current = window.setInterval(() => setCount((c) => c + 1), 1000);
    return () => { if (timer.current) window.clearInterval(timer.current); };
  }, []);

  useEffect(() => {
    const limit = phase === "in" ? IN : phase === "hold" ? HOLD : OUT;
    if (count >= limit) {
      if (phase === "in") setPhase("hold");
      else if (phase === "hold") setPhase("out");
      else if (round < rounds) { setRound((r) => r + 1); setPhase("in"); }
      setCount(0);
    }
  }, [count, phase, IN, HOLD, OUT, rounds, round]);

  const label = phase === "in" ? "Breathe in" : phase === "hold" ? "Hold" : "Breathe out";
  const total = phase === "in" ? IN : phase === "hold" ? HOLD : OUT;
  const progress = Math.min(1, count / total);

  return (
    <div className="breathing">
      <div className="orb" style={{ transform: `scale(${1 + progress * 0.2})`, opacity: 0.9 + progress * 0.1 }} />
      <div className="breathing-label">{label}</div>
      <div className="breathing-count">{total - count}s</div>
      <div className="breathing-round">Round {round} / {rounds}</div>
      {script && <p className="breathing-script">{script}</p>}
    </div>
  );
}
