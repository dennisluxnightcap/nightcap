export type Breathing = { pattern: string; rounds: number; script?: string };

export type SummaryItem = {
  title: string;
  url?: string;
  description?: string;
  image?: string; // thumbnail (optional)
};

export type Daily = {
  summary: (string | SummaryItem)[];
  feelGood: string;
  learn: string;
  story: string;
  breathing: Breathing;
};
