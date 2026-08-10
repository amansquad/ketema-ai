import type { WeatherKind } from "@/features/simulation/store/useSimulationStore";

// A four-season year for the Ethiopian highlands (Addis Ababa sits at ~2,400 m
// and follows this rhythm): the long rains of Kiremt (Jun–Sep), the dry Bega
// (Dec–Feb), the short rains of Belg (Mar–May), and Tseday (Oct–Nov) as the
// transition out of the rains.
//
// The weather probabilities are NOT four fixed tables — each season is an
// anchor on a continuous annual curve, and weatherWeightsForDay() interpolates
// between the two nearest anchors for every single day of the year. Early
// June is measurably wetter than late September; the odds creep smoothly
// instead of snapping at calendar boundaries.
export type SeasonKind = "kiremt" | "tseday" | "bega" | "belg";

/**
 * Season boundaries on a 365-day clock (inclusive ranges; everything else is
 * Bega, which wraps the turn of the year) — used only for the season label:
 *   belg   short rains  Mar 1  – May 31  (days 59–150)
 *   kiremt long rains   Jun 1  – Sep 30  (days 151–272)
 *   tseday transition   Oct 1  – Nov 30  (days 273–333)
 *   bega   dry season   Dec 1  – Feb 28  (days 334–364, 0–58)
 */
export function seasonForDay(dayOfYear: number): SeasonKind {
  const day = ((dayOfYear % 365) + 365) % 365;
  if (day >= 59 && day <= 150) return "belg";
  if (day >= 151 && day <= 272) return "kiremt";
  if (day >= 273 && day <= 333) return "tseday";
  return "bega";
}

// Baseline weights per season, read as percentages (each column sums to 100).
// These are the anchor points of the annual curve: storms are a Kiremt event,
// dust and haze are Bega's, and clear/cloudy share the rest of the year.
export const SEASON_WEATHER_WEIGHTS: Record<SeasonKind, Record<WeatherKind, number>> = {
  belg: {
    clear: 15,
    cloudy: 20,
    overcast: 10,
    rain: 12,
    drizzle: 12,
    storm: 5,
    snow: 1,
    fog: 6,
    haze: 10,
    dust: 5,
    windy: 4,
  },
  kiremt: {
    clear: 4,
    cloudy: 14,
    overcast: 20,
    rain: 22,
    drizzle: 18,
    storm: 12,
    snow: 2,
    fog: 6,
    haze: 2,
    dust: 0,
    windy: 0,
  },
  tseday: {
    clear: 20,
    cloudy: 25,
    overcast: 12,
    rain: 10,
    drizzle: 10,
    storm: 5,
    snow: 2,
    fog: 8,
    haze: 5,
    dust: 0,
    windy: 3,
  },
  bega: {
    clear: 35,
    cloudy: 12,
    overcast: 4,
    rain: 3,
    drizzle: 3,
    storm: 0,
    snow: 2,
    fog: 8,
    haze: 20,
    dust: 5,
    windy: 8,
  },
};

// Midpoint day-of-year of each season, in ascending order around the year.
// These are where the curve passes exactly through the season's baseline
// weights: Jan 15 (bega), Apr 15 (belg), Aug 1 (kiremt), Nov 1 (tseday).
const SEASON_ANCHOR_DAYS: Record<SeasonKind, number> = {
  bega: 14,
  belg: 105,
  kiremt: 212,
  tseday: 303,
};

const SEASON_ANCHOR_ORDER: SeasonKind[] = ["bega", "belg", "kiremt", "tseday"];

/**
 * The day's weather probability curve — each season's baseline weights,
 * linearly interpolated between the two nearest season anchors so the odds
 * drift day by day through the whole year (including across the Dec→Jan wrap).
 * Because every baseline sums to 100 and lerping preserves the sum, the result
 * is always a valid weight table.
 */
export function weatherWeightsForDay(dayOfYear: number): Record<WeatherKind, number> {
  const day = ((dayOfYear % 365) + 365) % 365;
  // Shift the clock so the first anchor (bega, day 14) sits at 0 and the year
  // no longer wraps through the middle of a segment.
  const first = SEASON_ANCHOR_DAYS[SEASON_ANCHOR_ORDER[0]];
  const shifted = (((day - first) % 365) + 365) % 365;
  const shiftedAnchors = SEASON_ANCHOR_ORDER.map(
    (kind) => (SEASON_ANCHOR_DAYS[kind] - first + 365) % 365,
  );

  // The day falls in segment [anchor[index], anchor[index+1]) — the loop
  // invariant that keeps t in [0, 1) and lands anchor days exactly on their
  // season's baseline (t = 0).
  let index = SEASON_ANCHOR_ORDER.length - 1;
  for (let i = 0; i < SEASON_ANCHOR_ORDER.length - 1; i++) {
    if (shifted < shiftedAnchors[i + 1]) {
      index = i;
      break;
    }
  }
  const next = (index + 1) % SEASON_ANCHOR_ORDER.length;
  const span =
    next === 0
      ? 365 - shiftedAnchors[index] + shiftedAnchors[0]
      : shiftedAnchors[next] - shiftedAnchors[index];
  const t = Math.min(1, Math.max(0, (shifted - shiftedAnchors[index]) / span));

  const prev = SEASON_WEATHER_WEIGHTS[SEASON_ANCHOR_ORDER[index]];
  const nextWeights = SEASON_WEATHER_WEIGHTS[SEASON_ANCHOR_ORDER[next]];
  const result = {} as Record<WeatherKind, number>;
  for (const kind of Object.keys(prev) as WeatherKind[]) {
    result[kind] = prev[kind] + (nextWeights[kind] - prev[kind]) * t;
  }
  return result;
}

function weightedPick(weights: Record<WeatherKind, number>, random: () => number): WeatherKind {
  const kinds = Object.keys(weights) as WeatherKind[];
  const roll = random() * 100;
  let cumulative = 0;
  for (let i = 0; i < kinds.length; i++) {
    const kind = kinds[i];
    // Snap the final bucket to exactly 100 so float rounding can never leave a
    // roll above the summed weights (which would fall through to a wrong kind).
    cumulative += i === kinds.length - 1 ? 100 - cumulative : weights[kind];
    if (roll <= cumulative) return kind;
  }
  return kinds[kinds.length - 1];
}

/**
 * Weighted random weather for a given day of the year, using that day's
 * interpolated probability curve. The same picker drives the auto-weather
 * system and the "randomize" button so the two can never disagree. When
 * `avoid` is given (e.g. the current weather), it re-rolls a few times so
 * consecutive events don't visibly repeat and the sky never looks "stuck".
 */
export function pickWeatherForDay(
  dayOfYear: number,
  random: () => number = Math.random,
  avoid?: WeatherKind,
): WeatherKind {
  const weights = weatherWeightsForDay(dayOfYear);
  if (!avoid) return weightedPick(weights, random);
  for (let attempt = 0; attempt < 3; attempt++) {
    const kind = weightedPick(weights, random);
    if (kind !== avoid) return kind;
  }
  return weightedPick(weights, random);
}

/** Simulated hours a weather event lasts before the next one rolls (4–16 h). */
export function randomWeatherDurationHours(random: () => number = Math.random): number {
  return 4 + random() * 12;
}
