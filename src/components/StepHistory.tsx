import { motion } from "framer-motion";
import type { StepLog } from "../utils/stepTracker";
import StepTrends from "./StepTrends";

export default function StepHistory({
  steps,
  granted,
  logs,
  onRequestPermission,
}: {
  steps: number | null;
  granted: boolean | null;
  logs: StepLog[];
  onRequestPermission: () => void;
}) {
  if (granted === false) {
    return (
      <motion.div
        className="bedtime-history"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.0, delay: 0.4, ease: "easeOut" }}
      >
        <p className="history-label">Steps today</p>
        <p className="breathing-script" style={{ margin: "4px 0 10px" }}>
          Allow access to see your step count
        </p>
        <button className="nav-btn primary" onClick={onRequestPermission}>
          Enable
        </button>
      </motion.div>
    );
  }

  if (steps == null) return null;

  return (
    <motion.div
      className="bedtime-history"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1.0, delay: 0.4, ease: "easeOut" }}
    >
      <p className="history-label">Steps today</p>
      <p className="screentime-total" style={{ fontSize: "clamp(28px, 7vw, 40px)", margin: "4px 0 0" }}>
        {steps.toLocaleString()}
      </p>

      <StepTrends logs={logs} />
    </motion.div>
  );
}
