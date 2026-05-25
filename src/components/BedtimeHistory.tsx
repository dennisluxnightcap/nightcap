import React, { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getBedtimeHistory } from "../utils/bedtimeTracker";

/** Converts bedtime to minutes since noon (prevents midnight wrap issues). */
function minutesSinceNoon(date: Date): number {
  const mins = date.getHours() * 60 + date.getMinutes();
  return mins < 720 ? mins + 720 : mins - 720;
}

export default function BedtimeHistory() {
  // 🔹 Get full bedtime history and reverse to oldest → newest (left → right)
  const fullHistory = getBedtimeHistory().reverse();
  if (!fullHistory.length) return (
    <p className="history-label" style={{ opacity: 0.5, textAlign: "center" }}>
      Complete tonight's session to start tracking your bedtimes.
    </p>
  );

  // ✅ Only show the 4 most recent entries visually
  const history = fullHistory.slice(-4);

  // --- Trend calculation (based on the last 3–4 entries) ---
  const trend = useMemo(() => {
    const n = history.length;
    if (n < 3) return null; // need at least 3 nights to say anything

    const avgMinutes = (arr: Date[]) =>
      arr.reduce((sum, d) => sum + minutesSinceNoon(d), 0) / arr.length;

    let earlierGroup: Date[];
    let recentGroup: Date[];

    if (n === 3) {
      // 3 entries: compare first night vs last two
      earlierGroup = [history[0]];
      recentGroup = history.slice(1);
    } else {
      // 4 entries: compare first two vs last two
      earlierGroup = history.slice(0, 2);
      recentGroup = history.slice(2);
    }

    const diff = avgMinutes(earlierGroup) - avgMinutes(recentGroup);
    // diff > 0 → recent bedtimes are earlier (better wind-down)
    const threshold = 20; // minutes

    if (diff > threshold) {
      return "You’ve been going to bed earlier lately 🌙";
    }
    if (diff < -threshold) {
      return "You’ve been drifting later recently 🌃";
    }
    return "Your bedtime’s been pretty steady 😌";
  }, [history]);

  const icons = ["🕙", "🕚", "🕛", "🕜", "🕒", "🕞", "🕓"];

  return (
    <div className="bedtime-history">
      <p className="history-label">Your recent bedtimes</p>

      <div className="history-row">
        {history.map((d, i) => {
          const time = d.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          });
          const icon = icons[i % icons.length];
          return (
            <span key={i} className="history-face">
              {icon}&nbsp;{time}
            </span>
          );
        })}
      </div>

      {/* --- Trend Feedback --- */}
      <AnimatePresence>
        {trend && (
          <motion.p
            key="trend"
            className="mood-feedback"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
          >
            {trend}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
