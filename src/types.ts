// src/types.ts
export type Breathing = {
  pattern: string;
  rounds: number;
  script?: string;
  why?: string;
};

export type SummaryItem = {
  title: string;
  url?: string;
  description?: string;
  image?: string; // thumbnail (optional)
};

// Shared type for fact-like cards
export type Fact = {
  text: string;
  sub?: string;
  image?: string;
};

// ✅ Brightspot type is just a Fact with extras
export type Brightspot = Fact & {
  source?: string;
  year?: number;
  /** Link to the original article -- makes the source credit clickable,
   * which matters more here than elsewhere: brightspot images are often
   * hotlinked from the source site rather than custom-made, so crediting
   * with a real link back keeps that closer to normal news aggregation. */
  url?: string;
};

// ✅ New Video type
export type Video = {
  title: string;
  url: string;
  source?: string;
  year?: number;
};

// ✅ New HistoryEvent type
export type HistoryEvent = {
  year: string | number;
  text: string;
  image?: string | null;
  link?: string;
};

// ✅ Daily structure (now includes history array)
export type Daily = {
  history: HistoryEvent[];
  factsCategory: "feelGood" | "learn" | "history";
  feelGood: Fact;
  learn: Fact;
  story: Fact;
  breathing: Breathing;
  brightspot: Brightspot;
  video: Video;
};
