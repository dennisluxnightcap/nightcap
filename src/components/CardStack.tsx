// src/components/CardStack.tsx
// Horizontally swipeable stack of cards using native scroll-snap (real
// momentum/elastic feel, no manual drag math). Full-width slides — no
// peek, since the cards vary in height across themes and a partial
// neighbor at a mismatched height read as broken rather than intentional.
import { useEffect, useRef, useState } from "react";
import { Pointer } from "lucide-react";

export default function CardStack({
  cards,
  onNext,
  onPrev,
}: {
  cards: React.ReactNode[];
  onNext: () => void;
  onPrev?: () => void;
}) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [index, setIndex] = useState(0);
  const [hasSwiped, setHasSwiped] = useState(false);
  const [showFingerHint, setShowFingerHint] = useState(false);
  const [viewportHeight, setViewportHeight] = useState<number | undefined>(undefined);
  const count = cards.length;

  // Slides vary a lot in natural height across themes (a video card vs. a
  // long story with a background image). Without this, the flex row
  // stretches every slide to match the tallest one, so shorter cards leave
  // a big dead gap before the dots/nav — track just the visible slide's
  // height instead, and animate between them via CSS transition.
  useEffect(() => {
    const slide = slideRefs.current[index];
    if (!slide) return;
    const update = () => setViewportHeight(slide.offsetHeight);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(slide);
    return () => ro.disconnect();
  }, [index]);

  // One-time physical demo of the gesture, Tinder-style: a phantom
  // fingertip drags right-to-left (the actual gesture that advances the
  // stack) in sync with the card itself nudging forward and springing
  // back, rather than only describing the gesture in text.
  useEffect(() => {
    if (count <= 1) return;
    const el = viewportRef.current;
    if (!el) return;
    const timers: number[] = [];
    timers.push(
      window.setTimeout(() => {
        setShowFingerHint(true);
        timers.push(
          window.setTimeout(() => {
            el.scrollTo({ left: 28, behavior: "smooth" });
          }, 1300)
        );
        timers.push(
          window.setTimeout(() => {
            el.scrollTo({ left: 0, behavior: "smooth" });
          }, 3150)
        );
        timers.push(window.setTimeout(() => setShowFingerHint(false), 4300));
      }, 900)
    );
    return () => timers.forEach((t) => window.clearTimeout(t));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleScroll() {
    const el = viewportRef.current;
    if (!el) return;
    let closest = 0;
    let closestDist = Infinity;
    slideRefs.current.forEach((slide, i) => {
      if (!slide) return;
      const dist = Math.abs(slide.offsetLeft - el.scrollLeft);
      if (dist < closestDist) {
        closestDist = dist;
        closest = i;
      }
    });
    setIndex((prev) => {
      if (closest !== prev) setHasSwiped(true);
      return closest;
    });
  }

  function goTo(i: number) {
    const slide = slideRefs.current[i];
    const el = viewportRef.current;
    if (!slide || !el) return;
    el.scrollTo({ left: slide.offsetLeft, behavior: "smooth" });
    setHasSwiped(true);
  }

  return (
    <div className="card-stack">
      <div
        className="card-stack-viewport"
        ref={viewportRef}
        onScroll={handleScroll}
        style={viewportHeight ? { height: viewportHeight } : undefined}
      >
        {cards.map((card, i) => (
          <div
            className="card-stack-slide"
            key={i}
            ref={(el) => {
              slideRefs.current[i] = el;
            }}
          >
            {card}
          </div>
        ))}
      </div>

      {showFingerHint && (
        <div className="card-stack-gesture-lane" aria-hidden>
          <div className="card-stack-gesture-trail" />
          <Pointer className="card-stack-gesture-icon" size={20} strokeWidth={2} />
        </div>
      )}

      {!hasSwiped && count > 1 && (
        <p className="card-stack-swipe-hint" aria-hidden>
          Swipe for more <span className="card-stack-swipe-hint-arrow">&rsaquo;</span>
        </p>
      )}

      {count > 1 && (
        <div className="card-stack-dots" role="tablist" aria-label="More content">
          {cards.map((_, i) => (
            <button
              key={i}
              type="button"
              className={`card-stack-dot ${i === index ? "active" : ""}`}
              onClick={() => goTo(i)}
              aria-label={`Show item ${i + 1} of ${count}`}
            />
          ))}
        </div>
      )}

      <div style={{ marginTop: 16 }}>
        <nav className="nav-buttons" aria-label="Card navigation">
          <button
            className="nav-btn primary"
            onClick={onPrev ? onPrev : undefined}
            aria-label="Back"
            disabled={!onPrev}
            title={onPrev ? "Back" : ""}
          >
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
              <path
                d="M16 19L8 12l8-7"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          <button
            className="nav-btn primary pulse"
            onClick={onNext}
            aria-label="Next"
            title="Next"
          >
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
              <path
                d="M8 5l8 7-8 7"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </nav>
      </div>
    </div>
  );
}
