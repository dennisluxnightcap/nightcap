// types.ts

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
  image?: string;
};

// ✅ Brightspot type is just a Fact with extras
export type Brightspot = Fact & {
  source?: string;
  year?: number;
};

// ✅ New Video type
export type Video = {
  title: string;
  url: string;
  source?: string;
  year?: number;
};

export type Daily = {
  summary: (string | SummaryItem)[];
  feelGood: Fact;
  learn: Fact;
  story: Fact;
  breathing: Breathing;
  brightspot: Brightspot;
  video: Video; // ✅ added here
};
