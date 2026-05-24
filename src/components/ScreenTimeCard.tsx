import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import ScreenTime, { formatDuration } from "../utils/screenTime";
import type { ScreenTimeResult } from "../utils/screenTime";

export default function ScreenTimeCard({
  onNext,
  onPrev,
}: {
  onNext: () => void;
  onPrev?: () => void;
}) {
  const [data, setData] = useState<ScreenTimeResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { granted } = await ScreenTime.hasPermission();
        if (!granted) {
          setData({ hasPermission: false });
          setLoading(false);
          return;
        }
        const result = await ScreenTime.getScreenTime();
        setData(result);
      } catch {
        setData({ hasPermission: false });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const navButtons = (
    <div style={{ marginTop: 16 }}>
      <nav className="nav-buttons" aria-label="Card navigation">
        <button
          className="nav-btn primary"
          onClick={onPrev}
          disabled={!onPrev}
          aria-label="Back"
        >
          <svg viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M16 19L8 12l8-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <button className="nav-btn primary pulse" onClick={onNext} aria-label="Next">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M8 5l8 7-8 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </nav>
    </div>
  );

  if (loading) return (
    <section className="screentime-section">
      <div className="section-hero"><p className="title">Loading…</p></div>
      {navButtons}
    </section>
  );

  if (!data?.hasPermission) return (
    <section className="screentime-section">
      <div className="section-hero">
        <h2 className="title">Screen time</h2>
        <p className="screentime-sub">See how you spent your day — grant access once and it works automatically.</p>
        <button
          className="nav-btn primary"
          style={{ marginTop: 20 }}
          onClick={async () => {
            await ScreenTime.requestPermission();
            const result = await ScreenTime.getScreenTime();
            setData(result);
          }}
        >
          Grant access
        </button>
      </div>
      {navButtons}
    </section>
  );

  const total = data.totalMs ?? 0;
  const apps = data.apps ?? [];

  return (
    <section className="screentime-section">
      <div className="section-hero">
        <h2 className="title">Your day on screen</h2>
        <p className="screentime-total">{formatDuration(total)}</p>
        <p className="screentime-sub">total screen time today</p>
      </div>

      <div className="bubble-card">
        {apps.length === 0 ? (
          <p className="screentime-empty">No app data for today yet.</p>
        ) : (
          <div className="screentime-list">
            {apps.map((app, i) => {
              const pct = total > 0 ? (app.timeMs / total) * 100 : 0;
              return (
                <motion.div
                  key={app.packageName}
                  className="screentime-row"
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08, duration: 0.4 }}
                >
                  <div className="screentime-row-top">
                    <span className="screentime-app">{app.appName}</span>
                    <span className="screentime-time">{formatDuration(app.timeMs)}</span>
                  </div>
                  <div className="screentime-bar-bg">
                    <motion.div
                      className="screentime-bar-fill"
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ delay: i * 0.08 + 0.2, duration: 0.5, ease: "easeOut" }}
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {navButtons}
    </section>
  );
}
