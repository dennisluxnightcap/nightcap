// utils/getStatic.ts
import type { Breathing } from "@/types";
import { stories } from "./storyPool";
import { brightspots } from "./brightspotPool";
import { videos } from "./videoPool"; // ✅ new import

// Helper: stable daily index
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

/** Types */
type Fact = {
  text: string;
  image?: string;
};

/** Fact pools */
const FEELGOOD: Fact[] = [
  { text: "Cows have best friends and get stressed when separated.", image: "/images/cows.png" },
  { text: "Elephants recognize themselves in mirrors.", image: "/images/elephants.png" },
  { text: "A group of kittens is called a kindle.", image: "/images/kitten.png" },
  { text: "Bees can recognize human faces.", image: "/images/bees.png" },
  { text: "Dogs’ noses are as unique as fingerprints.", image: "/images/dognose.png" },
  { text: "Humpback whales compose local “hit songs.”", image: "/images/whales.png" },
  { text: "Penguins propose with pebbles.", image: "/images/penguins.png" },
];

const LEARN: Fact[] = [
  { text: "Sharks are older than trees.", image: "/images/sharks.png" },
  { text: "Bananas are berries, strawberries aren’t.", image: "/images/bananas.png" },
  { text: "A day on Venus is longer than a year on Venus.", image: "/images/venus.png" },
  { text: "Octopuses have three hearts and blue blood.", image: "/images/octopus.png" },
  { text: "Water can boil and freeze at the same time (triple point).", image: "/images/water.png" },
  { text: "The Eiffel Tower can grow ~15 cm in summer heat.", image: "/images/eiffel.png" },
  { text: "Lightning can strike the same place twice (and often does).", image: "/images/lightning.png" },
  { text: "Honey never spoils when sealed.", image: "/images/honey.png" },
];

const BREATHING: Breathing[] = [
  { pattern: "4-7-8", rounds: 3, script: "Inhale 4, hold 7, exhale 8. Slow and steady." },
  { pattern: "Box 4-4-4-4", rounds: 4, script: "Inhale 4, hold 4, exhale 4, hold 4 — draw a square with your breath." },
  { pattern: "5-5", rounds: 5, script: "Inhale 5, exhale 5. Smooth, even rhythm." },
  { pattern: "6-2-6", rounds: 4, script: "Inhale 6, hold 2, exhale 6." },
];

/** Final export */
export function getStaticContent(date: Date = new Date()) {
  return {
    feelGood: pickByDate(FEELGOOD, date),
    learn: pickByDate(LEARN, date),
    story: pickByDate(stories, date),
    breathing: pickByDate(BREATHING, date),
    brightspot: pickByDate(brightspots, date),
    video: pickByDate(videos, date), // ✅ new
  };
}
