// src/components/TrendAlertBanner.tsx
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function TrendAlertBanner({
  message,
  onShown,
}: {
  message: string;
  onShown: () => void;
}) {
  const [dismissed, setDismissed] = useState(false);

  // Persist the cooldown state once the banner has actually been displayed,
  // not just computed — so a alert that never rendered can't burn its cooldown.
  useEffect(() => {
    onShown();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AnimatePresence>
      {!dismissed && (
        <motion.div
          className="trend-alert-banner"
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <p className="trend-alert-text">{message}</p>
          <button
            className="trend-alert-dismiss"
            onClick={() => setDismissed(true)}
            aria-label="Dismiss"
            title="Dismiss"
          >
            ×
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
