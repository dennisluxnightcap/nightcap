import HeadlineCard from "./HeadlineCard";

export default function DailySummary() {
  return (
    <section>
      <header className="section-hero summary-hero">
        <div className="badge">
          <img src="/icons/daily.png" alt="Daily recap" className="badge-icon" />
        </div>
        <h2 className="title">
          A look back at <span className="accent">today</span>
        </h2>
      </header>

      {/* Single source of truth for headlines; fetching happens inside HeadlineCard */}
      <HeadlineCard />
    </section>
  );
}
