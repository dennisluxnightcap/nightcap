import type { Breathing } from "@/types";

function localISO(d: Date = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0; // 32-bit
  }
  return Math.abs(hash);
}

function pickByDate<T>(arr: T[], date: Date = new Date()): T {
  const key = localISO(date);
  const idx = hashString(key) % arr.length;
  return arr[idx];
}

/** You can expand these lists anytime */
const FEELGOOD: string[] = [
  "Sea otters hold hands while they sleep so they don’t drift apart.",
  "Penguins propose with pebbles.",
  "Cows have best friends and get stressed when separated.",
  "Elephants recognize themselves in mirrors.",
  "A group of kittens is called a kindle.",
  "Bees can recognize human faces.",
  "Dogs’ noses are as unique as fingerprints.",
  "Humpback whales compose local “hit songs.”"
];

const LEARN: string[] = [
  "Sharks are older than trees.",
  "Bananas are berries, strawberries aren’t.",
  "A day on Venus is longer than a year on Venus.",
  "Octopuses have three hearts and blue blood.",
  "Water can boil and freeze at the same time (triple point).",
  "The Eiffel Tower can grow ~15 cm in summer heat.",
  "Lightning can strike the same place twice (and often does).",
  "Honey never spoils when sealed."
];

const BREATHING: Breathing[] = [
  { pattern: "4-7-8", rounds: 3, script: "Inhale 4, hold 7, exhale 8. Slow and steady." },
  { pattern: "Box 4-4-4-4", rounds: 4, script: "Inhale 4, hold 4, exhale 4, hold 4 — draw a square with your breath." },
  { pattern: "5-5", rounds: 5, script: "Inhale 5, exhale 5. Smooth, even rhythm." },
  { pattern: "6-2-6", rounds: 4, script: "Inhale 6, hold 2, exhale 6. Relax your shoulders." }
];

export function getStaticContent(date: Date = new Date()) {
  return {
    feelGood: pickByDate(FEELGOOD, date),
    learn: pickByDate(LEARN, date),
    breathing: pickByDate(BREATHING, date)
  };
}
