// src/utils/nightcapDay.ts
/**
 * Date key for the "nightcap day" containing `d`: the calendar date of the
 * most recent noon at or before `d`. Bedtime/steps/screen time all get
 * recorded during a wind-down ritual that can run past midnight, so keying
 * them to calendar-midnight would make a 1am finish land on a near-empty
 * "new day." Anchoring the seam at noon instead keeps a whole
 * evening-into-early-morning session under one date.
 */
export function nightcapDateKey(d: Date = new Date()): string {
  const shifted = new Date(d);
  if (shifted.getHours() < 12) {
    shifted.setDate(shifted.getDate() - 1);
  }
  const y = shifted.getFullYear();
  const m = String(shifted.getMonth() + 1).padStart(2, "0");
  const day = String(shifted.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
