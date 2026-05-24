// src/utils/getStatic.ts
import type { Breathing, Fact } from "@/types";
import { stories } from "./storyPool";
import { brightspots } from "./brightspotPool";
import { videos } from "./videoPool";

/* -----------------------
   Date + hash helpers
   ----------------------- */

// Local ISO date like 2025-11-24 (no time)
function localISO(d: Date = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// Old hash-based picker (fallback for SSR / no localStorage)
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

/* -----------------------
   Rotation state helpers
   ----------------------- */

type RotationState = {
  order: number[];   // permutation of indices
  index: number;     // current position in order
  lastDate: string;  // last date we advanced for
};

function shuffleIndices(len: number): number[] {
  const arr = Array.from({ length: len }, (_, i) => i);
  // Fisher–Yates
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Pick an item with:
 * - one item per calendar day
 * - no repeats until all items were used
 * - then reshuffle and start a new cycle
 * - stable within the same day
 *
 * Falls back to deterministic date-hash if localStorage is not available
 * (SSR / server environment).
 */
function pickWithDailyRotation<T>(
  arr: T[],
  storageKey: string,
  date: Date = new Date()
): T {
  const today = localISO(date);

  // If we are on the server or do not have localStorage, fall back
  if (typeof window === "undefined" || !("localStorage" in window)) {
    return pickByDate(arr, date);
  }

  let state: RotationState | null = null;

  try {
    const raw = window.localStorage.getItem(storageKey);
    if (raw) {
      state = JSON.parse(raw) as RotationState;
    }
  } catch {
    // ignore parse errors, will re-init state
  }

  // Init or reset state if needed
  if (
    !state ||
    !Array.isArray(state.order) ||
    state.order.length !== arr.length
  ) {
    state = {
      order: shuffleIndices(arr.length),
      index: 0,
      lastDate: today,
    };
  }

  // If we have moved to a new day, advance the index (once per day)
  if (state.lastDate !== today) {
    // advance to next position OR reshuffle if cycle exhausted
    if (state.index < state.order.length - 1) {
      state.index += 1;
    } else {
      state.order = shuffleIndices(arr.length);
      state.index = 0;
    }
    state.lastDate = today;
  }

  const currentIdx = state.order[state.index] ?? 0;
  const item = arr[currentIdx];

  try {
    window.localStorage.setItem(storageKey, JSON.stringify(state));
  } catch {
    // ignore storage errors; content still works for this session
  }

  return item;
}

/* -----------------------
   Fact & breathing pools
   ----------------------- */

const FEELGOOD: Fact[] = [
  {
    text: "Cows have best friends — and they get anxious when apart",
    sub: "Heart rates jump when they’re separated",
    image: "/images/cows.png",
  },
  {
    text: "Elephants can recognize themselves in mirrors — a sign of self-awareness",
    sub: "Only dolphins, apes, and magpies share that skill",
    image: "/images/elephants.png",
  },
  {
    text: "Bees can recognize human faces — and remember them for days",
    sub: "Humans only figured that out in 2005",
    image: "/images/bees.png",
  },
  {
    text: "Every dog’s nose print is one of a kind — just like a fingerprint",
    sub: "Some kennels already use them for ID",
    image: "/images/dognose.png",
  },
  {
    text: "Humpback whales sing songs that can travel across entire oceans",
    sub: "Every few years, the ocean’s chorus completely changes",
    image: "/images/whales.png",
  },
  {
    text: "When choosing a mate, penguins present pebbles as love gifts",
    sub: "The best stones often get stolen",
    image: "/images/penguins.png",
  },
  {
    text: "Sea otters hold hands while they sleep so they don’t drift apart",
    sub: "It’s called a “raft” — sometimes dozens float together",
    image: "/images/otters.png",
  },
  {
    text: "Trees share nutrients and warnings through an underground network of fungi",
    sub: "Scientists call it the “wood-wide web”",
    image: "/images/trees.png",
  },
  {
    text: "Rats and mice laugh when tickled — we just can’t hear it",
    sub: "Their giggles hit ultrasonic frequencies",
    image: "/images/rats.png",
  },
  {
    text: "Butterflies taste with their feet — every step is a little taste test",
    sub: "It helps them pick the right leaves for their eggs",
    image: "/images/butterflies.png",
  },
];

const LEARN: Fact[] = [
  {
    text: "Sharks have existed for over 400 million years — older than trees",
    sub: "They’ve survived four mass extinctions",
    image: "/images/sharks.png",
  },
  {
    text: "Bananas are technically berries, but strawberries aren’t",
    sub: "Botany has its own rules for what counts as fruit",
    image: "/images/bananas.png",
  },
  {
    text: "Octopuses have three hearts and blue blood; two stop when they swim",
    sub: "Their circulation is built for short bursts, not long cruises",
    image: "/images/octopus.png",
  },
  {
    text: "Water can boil and freeze at the same time — at its triple point",
    sub: "A quirk of physics only seen under perfect lab conditions",
    image: "/images/water.png",
  },
  {
    text: "The Eiffel Tower grows about 15 cm taller in summer as the metal expands",
    sub: "Steel shifts more than most people realize",
    image: "/images/eiffel.png",
  },
  {
    text: "Honey never spoils — sealed jars thousands of years old are still edible",
    sub: "Its low water content and acidity preserve it indefinitely",
    image: "/images/honey.png",
  },
  {
    text: "Your stomach replaces its lining every few days to avoid digesting itself",
    sub: "A tiny rebuild that keeps the system running",
    image: "/images/stomach.png",
  },
  {
    text: "Fold a sheet of paper 42 times, and it would reach the Moon",
    sub: "That’s how fast exponential growth escalates",
    image: "/images/paper.png",
  },
  {
    text: "Old windows are thicker at the bottom because glass once cooled unevenly",
    sub: "They’ve flowed slowly for centuries under their own weight",
    image: "/images/glass.png",
  },
  {
    text: "Wombat poop is cube-shaped so it stays put and marks territory",
    sub: "The shape comes from ridged intestines, not squeezing",
    image: "/images/wombat.png",
  },
];

const BREATHING: Breathing[] = [
  { pattern: "4-7-8", rounds: 3, script: "Inhale 4, hold 7, exhale 8. Slow and steady." },
  { pattern: "Box 4-4-4-4", rounds: 4, script: "Inhale 4, hold 4, exhale 4, hold 4 — draw a square with your breath." },
  { pattern: "5-5", rounds: 5, script: "Inhale 5, exhale 5. Smooth, even rhythm." },
  { pattern: "6-2-6", rounds: 4, script: "Inhale 6, hold 2, exhale 6." },
];

/* -----------------------
   Final export
   ----------------------- */

export function getStaticContent(date: Date = new Date()) {
  return {
    feelGood: pickWithDailyRotation(FEELGOOD, "nc_feelgood_rotation", date),
    learn: pickWithDailyRotation(LEARN, "nc_learn_rotation", date),
    story: pickWithDailyRotation(stories, "nc_story_rotation", date),
    breathing: pickWithDailyRotation(BREATHING, "nc_breathing_rotation", date),
    brightspot: pickWithDailyRotation(brightspots, "nc_brightspot_rotation", date),
    video: pickWithDailyRotation(videos, "nc_video_rotation", date),
  };
}
