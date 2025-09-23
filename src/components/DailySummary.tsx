// DailySummary.tsx
import HeadlineCard from "./HeadlineCard";
import BrightSpot from "./BrightSpot";
import type { Brightspot } from "../types";

export default function DailySummary({
  onNext,
  spot,
}: {
  onNext: () => void;
  spot: Brightspot;
}) {
  return (
    <section className="daily-summary">
      <header className="section-hero summary-hero">
        <div className="badge">
          <img src="/icons/daily.png" alt="Daily recap" className="badge-icon" />
        </div>
        <h2 className="title">
          A look back at <span className="accent">today</span>
        </h2>
      </header>

      <HeadlineCard />

      {/* Bright Spot footer */}
      <BrightSpot spot={spot} onNext={onNext} />
    </section>
  );
}
