import React, { useEffect, useState } from "react";
import { motion, type Variants } from "framer-motion";

const container: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.55, delayChildren: 0.4 },
  },
};

// Start near the bottom of the screen and rise up into place
const item: Variants = {
  hidden: { opacity: 0, y: 160 },
  show: { opacity: 1, y: 0, transition: { duration: 2.2, ease: "easeOut" } },
};

export default function Onboarding({ onDone }: { onDone: () => void }) {
  // Keep the content unmounted for a couple seconds so any early layout
  // settling happens while the screen is just a plain dark background,
  // before the text exists to visibly jump.
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 1800);
    return () => clearTimeout(t);
  }, []);

  return (
    <motion.div
      className="onboarding-overlay"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.0, ease: "easeInOut" }}
    >
      <div className="onboarding-content">
        {ready && (
          <motion.div variants={container} initial="hidden" animate="show">
            <motion.span className="onboarding-moon" variants={item}>🌙</motion.span>

            <motion.h1 className="onboarding-title" variants={item}>
              Good evening
            </motion.h1>

            <motion.hr className="onboarding-divider" variants={item} />

            <motion.p className="onboarding-sub" variants={item}>
              Time to wind down
            </motion.p>

            <motion.hr className="onboarding-divider" variants={item} />

            <motion.p className="onboarding-bridge" variants={item}>
              But first — let's see what happened in the world today
            </motion.p>

            <motion.div variants={item}>
              <button className="onboarding-btn" onClick={onDone}>
                Let's go
              </button>
            </motion.div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
