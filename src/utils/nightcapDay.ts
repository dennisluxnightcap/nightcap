// src/utils/nightcapDay.ts
/**
 * Hour before which a timestamp is treated as the tail end of the previous
 * calendar day rather than the start of a new one. Deliberately early
 * (4am, not noon): the clock alone can't tell "still up from last night"
 * apart from "woke up and it's a new day" -- past 4am it's overwhelmingly
 * the latter, so anything checked at a normal morning hour still reads as
 * a fresh day instead of inheriting yesterday's numbers.
 */
const SEAM_HOUR = 4;

/**
 * Date key for the "nightcap day" containing `d`: the calendar date of the
 * most recent `SEAM_HOUR`:00 at or before `d`. Bedtime/steps/screen time all
 * get recorded during a wind-down ritual that can run past midnight, so
 * keying them to calendar-midnight would make a 1am finish land on a
 * near-empty "new day." Anchoring the seam a few hours later instead keeps
 * a whole evening-into-early-morning session under one date.
 */
export function nightcapDateKey(d: Date = new Date()): string {
  const shifted = new Date(d);
  if (shifted.getHours() < SEAM_HOUR) {
    shifted.setDate(shifted.getDate() - 1);
  }
  const y = shifted.getFullYear();
  const m = String(shifted.getMonth() + 1).padStart(2, "0");
  const day = String(shifted.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
