export type Breathing = { pattern: string; rounds: number; script?: string };
export type Daily = {
  summary: string[];   // <-- plain strings
  feelGood: string;
  learn: string;
  breathing: Breathing;
};
