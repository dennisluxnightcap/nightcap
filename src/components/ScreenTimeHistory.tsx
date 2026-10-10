import { motion } from "framer-motion";
import { formatDuration } from "../utils/screenTime";
import type { ScreenTimeLog } from "../utils/screenTimeTracker";
import ScreenTimeTrends from "./ScreenTimeTrends";
import TrendAlertBanner from "./TrendAlertBanner";
import { getScreenTimeTrendAlert, markScreenTimeTrendAlertShown } from "../utils/trendAlert";

export default function ScreenTimeHistory({
  todayMs,
  logs,
}: {
  todayMs: number;
  logs: ScreenTimeLog[];
}) {
  const ascendingLogs = [...logs].sort((a, b) => a.date.localeCompare(b.date));
  const screenTimeTrend = getScreenTimeTrendAlert(ascendingLogs);

  return (
    <motion.div
      className="bedtime-history screentime-history"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1.0, delay: 0.4, ease: "easeOut" }}
    >
      <p className="history-label">Screen time today</p>
      <p className="screentime-total" style={{ fontSize: "clamp(28px, 7vw, 40px)", margin: "4px 0 0" }}>
        {formatDuration(todayMs)}
      </p>

      {screenTimeTrend && (
        <TrendAlertBanner
          message="Been on your phone a bit more before bed lately."
          onShown={() => markScreenTimeTrendAlertShown(screenTimeTrend, ascendingLogs.length)}
        />
      )}

      <hr className="mood-trends-divider" />
      <ScreenTimeTrends logs={logs} />
    </motion.div>
  );
}
