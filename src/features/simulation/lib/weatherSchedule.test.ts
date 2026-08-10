import { describe, expect, it } from "vitest";

import type { WeatherKind } from "@/features/simulation/store/useSimulationStore";

import {
  pickWeatherForDay,
  randomWeatherDurationHours,
  seasonForDay,
  SEASON_WEATHER_WEIGHTS,
  type SeasonKind,
  weatherWeightsForDay,
} from "./weatherSchedule";

const ALL_SEASONS: SeasonKind[] = ["kiremt", "tseday", "bega", "belg"];

/** Small deterministic LCG for repeatable probability experiments. */
function lcg(seed: number): () => number {
  let value = seed % 2147483647;
  if (value <= 0) value += 2147483646;
  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
}

// Midpoint anchor days — the curve passes exactly through each season's
// baseline weights here.
const KIREMT_ANCHOR = 212; // Aug 1
const TSEDAY_ANCHOR = 303; // Nov 1
const BEGA_ANCHOR = 14; // Jan 15
const BELG_ANCHOR = 105; // Apr 15

describe("seasonForDay", () => {
  it("starts the year (Jan 1) in the dry Bega season", () => {
    expect(seasonForDay(0)).toBe("bega");
  });

  it("maps the short rains of Belg (Mar–May) correctly", () => {
    expect(seasonForDay(59)).toBe("belg"); // Mar 1
    expect(seasonForDay(120)).toBe("belg"); // May 1
    expect(seasonForDay(150)).toBe("belg"); // May 31
  });

  it("maps the long rains of Kiremt (Jun–Sep) correctly", () => {
    expect(seasonForDay(151)).toBe("kiremt"); // Jun 1
    expect(seasonForDay(213)).toBe("kiremt"); // Aug 1
    expect(seasonForDay(272)).toBe("kiremt"); // Sep 30
  });

  it("maps the Tseday transition (Oct–Nov) correctly", () => {
    expect(seasonForDay(273)).toBe("tseday"); // Oct 1
    expect(seasonForDay(333)).toBe("tseday"); // Nov 30
  });

  it("wraps back to Bega for December and negative day values", () => {
    expect(seasonForDay(334)).toBe("bega"); // Dec 1
    expect(seasonForDay(364)).toBe("bega"); // Dec 31
    expect(seasonForDay(-1)).toBe("bega"); // wraps to Dec 31
  });

  it("normalizes overflow past a full year", () => {
    expect(seasonForDay(365)).toBe("bega"); // Jan 1 again
    expect(seasonForDay(365 + 151)).toBe("kiremt");
    expect(seasonForDay(730 + 273)).toBe("tseday");
  });
});

describe("SEASON_WEATHER_WEIGHTS (anchor baselines)", () => {
  it("keeps every season's weights summing to 100", () => {
    for (const season of ALL_SEASONS) {
      const total = Object.values(SEASON_WEATHER_WEIGHTS[season]).reduce(
        (sum, weight) => sum + weight,
        0,
      );
      expect(total).toBe(100);
    }
  });

  it("reserves storms for the rainy seasons and dust for the dry ones", () => {
    expect(SEASON_WEATHER_WEIGHTS.kiremt.storm).toBeGreaterThan(0);
    expect(SEASON_WEATHER_WEIGHTS.belg.storm).toBeGreaterThan(0);
    expect(SEASON_WEATHER_WEIGHTS.bega.storm).toBe(0);
    expect(SEASON_WEATHER_WEIGHTS.bega.dust).toBeGreaterThan(0);
    expect(SEASON_WEATHER_WEIGHTS.kiremt.dust).toBe(0);
  });
});

describe("weatherWeightsForDay — the smooth annual curve", () => {
  it("passes exactly through each season's baseline at its anchor day", () => {
    const anchors: { day: number; season: SeasonKind }[] = [
      { day: BEGA_ANCHOR, season: "bega" },
      { day: BELG_ANCHOR, season: "belg" },
      { day: KIREMT_ANCHOR, season: "kiremt" },
      { day: TSEDAY_ANCHOR, season: "tseday" },
    ];
    for (const { day, season } of anchors) {
      const weights = weatherWeightsForDay(day);
      for (const kind of Object.keys(weights) as WeatherKind[]) {
        expect(weights[kind]).toBe(SEASON_WEATHER_WEIGHTS[season][kind]);
      }
    }
  });

  it("interpolates between season baselines instead of snapping", () => {
    // Halfway between Kiremt (rain 22) and Tseday (rain 10): ~16.
    const mid = weatherWeightsForDay(258);
    expect(mid.rain).toBeCloseTo(16, 0);
    // And it's neither the Kiremt nor the Tseday table outright.
    expect(mid.rain).toBeLessThan(SEASON_WEATHER_WEIGHTS.kiremt.rain);
    expect(mid.rain).toBeGreaterThan(SEASON_WEATHER_WEIGHTS.tseday.rain);
  });

  it("keeps every day's curve summing to 100", () => {
    for (let day = 0; day < 365; day += 5) {
      const total = Object.values(weatherWeightsForDay(day)).reduce(
        (sum, weight) => sum + weight,
        0,
      );
      expect(total).toBeCloseTo(100, 6);
    }
  });

  it("ramps rain up through Belg→Kiremt and down through Kiremt→Tseday", () => {
    const rainAt = (day: number): number => weatherWeightsForDay(day).rain;
    // Monotonically increasing up to the Kiremt anchor (the rain peak).
    for (let day = BELG_ANCHOR; day + 7 <= KIREMT_ANCHOR; day += 7) {
      expect(rainAt(day + 7)).toBeGreaterThanOrEqual(rainAt(day));
    }
    // Monotonically decreasing after the Kiremt anchor through Tseday.
    for (let day = KIREMT_ANCHOR; day + 7 <= TSEDAY_ANCHOR; day += 7) {
      expect(rainAt(day + 7)).toBeLessThanOrEqual(rainAt(day));
    }
  });

  it("stays continuous across the Dec→Jan wrap", () => {
    const lateDec = weatherWeightsForDay(364);
    const newYear = weatherWeightsForDay(0);
    // Both blend Tseday toward Bega: clear climbing toward 35, dust appearing.
    expect(lateDec.clear).toBeGreaterThan(SEASON_WEATHER_WEIGHTS.tseday.clear);
    expect(newYear.clear).toBeGreaterThan(SEASON_WEATHER_WEIGHTS.tseday.clear);
    expect(lateDec.clear).toBeLessThan(SEASON_WEATHER_WEIGHTS.bega.clear);
    expect(lateDec.dust).toBeGreaterThan(0);
    expect(newYear.dust).toBeGreaterThan(0);
    // And the two adjacent days differ only slightly — no boundary jump.
    expect(Math.abs(newYear.clear - lateDec.clear)).toBeLessThan(1);
  });

  it("normalizes day values outside 0–364", () => {
    expect(weatherWeightsForDay(365).clear).toBe(weatherWeightsForDay(0).clear);
    expect(weatherWeightsForDay(-1).rain).toBe(weatherWeightsForDay(364).rain);
  });
});

describe("pickWeatherForDay", () => {
  it("only ever returns a kind with positive weight on that day", () => {
    const rand = lcg(1234);
    for (const day of [0, 60, 120, 200, 258, 303, 364]) {
      const weights = weatherWeightsForDay(day);
      for (let i = 0; i < 300; i++) {
        const kind: WeatherKind = pickWeatherForDay(day, rand);
        expect(weights[kind]).toBeGreaterThan(0);
      }
    }
  });

  it("is deterministic under a fixed random stream", () => {
    expect(pickWeatherForDay(KIREMT_ANCHOR, () => 0.5)).toBe(
      pickWeatherForDay(KIREMT_ANCHOR, () => 0.5),
    );
  });

  it("draws rain far more often at the Kiremt anchor than the Bega anchor", () => {
    const rainRate = (day: number): number => {
      const rand = lcg(0xbeef);
      let hits = 0;
      const samples = 2000;
      for (let i = 0; i < samples; i++) {
        if (pickWeatherForDay(day, rand) === "rain") hits++;
      }
      return hits / samples;
    };
    expect(rainRate(KIREMT_ANCHOR)).toBeGreaterThan(0.15); // weight 22%
    expect(rainRate(BEGA_ANCHOR)).toBeLessThan(0.05); // weight 3%
  });

  it("ramps rain probability up through the wet season", () => {
    const rainRate = (day: number): number => {
      const rand = lcg(day);
      let hits = 0;
      const samples = 2000;
      for (let i = 0; i < samples; i++) {
        if (pickWeatherForDay(day, rand) === "rain") hits++;
      }
      return hits / samples;
    };
    // Early March (day 60) → early August (day 212): rain odds climb steadily.
    expect(rainRate(212)).toBeGreaterThan(rainRate(60));
    expect(rainRate(60)).toBeGreaterThan(rainRate(0));
  });

  it("re-rolls to avoid a given kind (anti-repeat)", () => {
    // On the Bega anchor (pure bega), first roll (0) lands on "clear"; the
    // avoided re-roll (0.5) lands elsewhere.
    const sequence = [0, 0.5];
    let index = 0;
    const rand = () => sequence[index++ % sequence.length];
    const pick = pickWeatherForDay(BEGA_ANCHOR, rand, "clear");
    expect(pick).not.toBe("clear");
    expect(weatherWeightsForDay(BEGA_ANCHOR)[pick]).toBeGreaterThan(0);
  });

  it("always returns a weighted kind even under a hostile stream", () => {
    const pick = pickWeatherForDay(BEGA_ANCHOR, () => 0, "clear");
    expect(weatherWeightsForDay(BEGA_ANCHOR)[pick]).toBeGreaterThan(0);
  });
});

describe("randomWeatherDurationHours", () => {
  it("spans a plausible 4–16 hour weather event window", () => {
    expect(randomWeatherDurationHours(() => 0)).toBe(4);
    expect(randomWeatherDurationHours(() => 0.5)).toBeCloseTo(10);
    expect(randomWeatherDurationHours(() => 1)).toBeCloseTo(16);
  });

  it("never returns a value outside the event window", () => {
    const rand = lcg(0xabc);
    for (let i = 0; i < 1000; i++) {
      const duration = randomWeatherDurationHours(rand);
      expect(duration).toBeGreaterThanOrEqual(4);
      expect(duration).toBeLessThanOrEqual(16);
    }
  });
});
