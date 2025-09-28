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
  { text: "Cows form close friendships and get stressed when separated.", image: "/images/cows.png" },
  { text: "Elephants can recognize themselves in mirrors — a sign of self-awareness.", image: "/images/elephants.png" },
  { text: "Bees can remember and recognize human faces.", image: "/images/bees.png" },
  { text: "Every dog’s nose print is unique, like a fingerprint.", image: "/images/dognose.png" },
  { text: "Humpback whales create songs that spread across oceans.", image: "/images/whales.png" },
  { text: "Penguins offer pebbles as gifts when choosing a mate.", image: "/images/penguins.png" },
  { text: "Sea otters hold hands while they sleep to avoid drifting apart.", image: "/images/otters.png" },
  { text: "Trees can communicate through underground fungal networks.", image: "/images/trees.png" },
  { text: "Rats and mice laugh when tickled, though humans can’t hear it.", image: "/images/rats.png" },
  { text: "Butterflies taste with their feet.", image: "/images/butterflies.png" },
];


const LEARN: Fact[] = [
  { text: "Sharks have existed for over 400 million years — older than trees.", image: "/images/sharks.png" },
  { text: "Bananas are technically berries, but strawberries aren’t.", image: "/images/bananas.png" },
  { text: "Octopuses have three hearts and blue blood; two hearts stop when they swim.", image: "/images/octopus.png" },
  { text: "Water can boil and freeze at the same time at its triple point.", image: "/images/water.png" },
  { text: "The Eiffel Tower can grow about 15 cm taller in summer heat as the metal expands.", image: "/images/eiffel.png" },
  { text: "Honey never spoils when sealed — jars thousands of years old are still edible.", image: "/images/honey.png" },
  { text: "Your stomach gets a new lining every 3–4 days to prevent it from digesting itself.", image: "/images/stomach.png" },
  { text: "If you could fold a piece of paper 42 times, it would reach the Moon.", image: "/images/paper.png" },
  { text: "Glass is a slow-flowing liquid — old windows are thicker at the bottom.", image: "/images/glass.png" },
  { text: "Wombat poop is cube-shaped so it doesn’t roll away.", image: "/images/wombat.png" },
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
