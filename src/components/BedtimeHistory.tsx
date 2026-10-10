import { getBedtimeLogs, getPreviousBedtimeLog } from "../utils/bedtimeTracker";
import BedtimeClock from "./BedtimeClock";

export default function BedtimeHistory() {
  const logs = getBedtimeLogs();
  const previous = getPreviousBedtimeLog(logs);

  if (!previous) {
    return (
      <p className="history-label" style={{ opacity: 0.5, textAlign: "center" }}>
        This was your first tracked night — check back tomorrow to see how it went.
      </p>
    );
  }

  const lastTime = new Date(previous.bedtime).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div className="bedtime-history">
      <p className="history-label">Bedtime last night</p>
      <p className="bedtime-headline">{lastTime}</p>

      <hr className="mood-trends-divider" />
      <BedtimeClock logs={logs} />
    </div>
  );
}
