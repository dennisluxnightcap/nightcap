export type Breathing = { 
  pattern: string; 
  rounds: number; 
  script?: string;
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
  image?: string; // optional so you can add later
};

export type Daily = {
  summary: (string | SummaryItem)[];
  feelGood: Fact;  // ✅ object with text + optional image
  learn: Fact;     // ✅ object with text + optional image
  story: Fact;     // ✅ changed from string → Fact
  breathing: Breathing;
};
