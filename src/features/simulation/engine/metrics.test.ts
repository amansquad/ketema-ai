import { describe, expect, it } from "vitest";

import { createSceneObject } from "@/features/editor/lib/createSceneObject";
import type { AssetKind, SceneObject } from "@/features/editor/types";
import type { WeatherKind } from "@/features/simulation/store/useSimulationStore";

import {
  computeCityMetrics,
  countByKind,
  daylightFactor,
  pollutionWeightFor,
  WEATHER_POLLUTION_MULTIPLIER,
} from "./metrics";

/**
 * Unit tests for the simulation engine (computeCityMetrics + helpers).
 *
 * The engine is deliberately linear and data-free (see the header comment in
 * metrics.ts), so every hook below is asserted against its literal constant:
 *   - 40 residents per residential building
 *   - 600 event-day visitors per stadium (separate from residents)
 *   - 12 jobs per warehouse, 25 commercial, 15 civic
 *   - pollution: warehouse +2 (scaled ×1.5 clear / ×1 cloudy / ×0.5 rain),
 *     road +3 sources; lake −2, fountain −0.75, tree −1.5, park −2.5 sinks;
 *     result clamped at ≥ 0
 *   - water metered from residents only (visitors don't consume it)
 */

function obj(assetKind: AssetKind): SceneObject {
  return createSceneObject({ assetKind });
}

function metricsFor(assetKinds: AssetKind[], hour = 12, weather: WeatherKind = "clear") {
  return computeCityMetrics(assetKinds.map(obj), hour, weather);
}

describe("countByKind", () => {
  it("tallies objects by kind", () => {
    const counts = countByKind([obj("road"), obj("road"), obj("lake"), obj("stadium")]);
    expect(counts).toEqual({ road: 2, lake: 1, stadium: 1 });
  });

  it("returns an empty record for an empty scene", () => {
    expect(countByKind([])).toEqual({});
  });
});

describe("daylightFactor", () => {
  it("peaks at noon and is zero through the night", () => {
    expect(daylightFactor(12)).toBeCloseTo(1);
    expect(daylightFactor(6)).toBeCloseTo(0);
    expect(daylightFactor(18)).toBeCloseTo(0);
    expect(daylightFactor(0)).toBe(0);
  });
});

describe("computeCityMetrics — empty scene baseline", () => {
  it("reports all-zero metrics", () => {
    const m = metricsFor([]);
    expect(m).toMatchObject({
      population: 0,
      residents: 0,
      eventVisitors: 0,
      jobs: 0,
      energyProductionKw: 0,
      energyConsumptionKw: 0,
      netEnergyKw: 0,
      waterConsumptionLitersPerDay: 0,
      pollutionIndex: 0,
      roadCount: 0,
      vehicleEstimate: 0,
      trafficDensity: 0,
    });
  });
});

describe("computeCityMetrics — residents", () => {
  it("counts 40 residents per residential building", () => {
    const m = metricsFor(["building-residential", "building-residential", "building-residential"]);
    expect(m.residents).toBe(120);
    expect(m.population).toBe(120);
    expect(m.eventVisitors).toBe(0);
  });

  it("meters water consumption from residents only (130 L/day each)", () => {
    const m = metricsFor(["building-residential", "building-residential"]);
    expect(m.waterConsumptionLitersPerDay).toBe(2 * 40 * 130);
  });
});

describe("computeCityMetrics — stadium event visitors", () => {
  it("adds 600 event-day visitors per stadium, separate from residents", () => {
    const m = metricsFor(["stadium", "stadium"]);
    expect(m.eventVisitors).toBe(1200);
    expect(m.residents).toBe(0);
    expect(m.population).toBe(1200);
  });

  it("combines residents and event visitors in the headline population", () => {
    const m = metricsFor(["building-residential", "building-residential", "stadium"]);
    expect(m.residents).toBe(80);
    expect(m.eventVisitors).toBe(600);
    expect(m.population).toBe(680);
  });

  it("keeps water consumption unchanged when a stadium is added (visitors don't drink residential water)", () => {
    const before = metricsFor(["building-residential"]);
    const after = metricsFor(["building-residential", "stadium"]);
    expect(after.waterConsumptionLitersPerDay).toBe(before.waterConsumptionLitersPerDay);
    expect(after.eventVisitors).toBe(600);
  });

  it("lets stadium visitors add traffic without consuming water", () => {
    // The engine documents that visitors skip residential water but still
    // generate trips — assert both halves of that tradeoff.
    const before = metricsFor(["building-residential"]);
    const after = metricsFor(["building-residential", "stadium"]);
    expect(after.vehicleEstimate).toBeGreaterThan(before.vehicleEstimate);
    expect(after.waterConsumptionLitersPerDay).toBe(before.waterConsumptionLitersPerDay);
  });
});

describe("computeCityMetrics — jobs", () => {
  it("adds 12 jobs per warehouse", () => {
    const m = metricsFor(["warehouse", "warehouse", "warehouse"]);
    expect(m.jobs).toBe(36);
  });

  it("adds commercial (25) and civic (15) jobs alongside warehouse jobs", () => {
    const m = metricsFor([
      "building-commercial",
      "building-commercial",
      "building-civic",
      "warehouse",
    ]);
    expect(m.jobs).toBe(25 * 2 + 15 + 12);
  });
});

describe("computeCityMetrics — pollution", () => {
  it("counts warehouses as industrial pollution sources (+2 each in neutral weather)", () => {
    const m = metricsFor(["warehouse", "warehouse", "warehouse"], 12, "cloudy");
    expect(m.pollutionIndex).toBe(6);
  });

  it("counts roads as pollution sources (+3 each)", () => {
    const m = metricsFor(["road", "road"]);
    expect(m.pollutionIndex).toBe(6);
  });

  it("lets lakes offset pollution (−2 each)", () => {
    // sources: 2 roads (6) + 1 warehouse (2) = 8; sinks: 2 lakes (4) → 4
    const m = metricsFor(["road", "road", "warehouse", "lake", "lake"], 12, "cloudy");
    expect(m.pollutionIndex).toBe(4);
  });

  it("clamps the pollution index at zero — blue space alone never goes negative", () => {
    expect(metricsFor(["lake", "lake", "lake"]).pollutionIndex).toBe(0);
    expect(metricsFor(["lake", "tree", "park"]).pollutionIndex).toBe(0);
  });

  it("treats fountains as modest air-quality sinks (−0.75 each)", () => {
    // 1 warehouse (2) vs 3 fountains (2.25) → clamped to 0
    expect(
      metricsFor(["warehouse", "fountain", "fountain", "fountain"], 12, "cloudy").pollutionIndex,
    ).toBe(0);
    // 2 warehouses (4) vs 2 fountains (1.5) → 2.5
    expect(
      metricsFor(["warehouse", "warehouse", "fountain", "fountain"], 12, "cloudy").pollutionIndex,
    ).toBe(2.5);
  });

  it("sinks trees and parks alongside water features", () => {
    // 1 warehouse (2) vs 1 tree (1.5) + 1 park (2.5) → clamped to 0
    expect(metricsFor(["warehouse", "tree", "park"], 12, "cloudy").pollutionIndex).toBe(0);
  });
});

describe("computeCityMetrics — weather-scaled warehouse pollution", () => {
  it("worsens in clear, stagnant air (×1.5)", () => {
    const m = metricsFor(["warehouse", "warehouse"]);
    expect(m.pollutionIndex).toBe(6); // 2 × (2 × 1.5)
  });

  it("stays neutral in cloudy weather (×1)", () => {
    const m = metricsFor(["warehouse", "warehouse"], 12, "cloudy");
    expect(m.pollutionIndex).toBe(4);
  });

  it("improves in rain, which scrubs emissions out (×0.5)", () => {
    const m = metricsFor(["warehouse", "warehouse"], 12, "rain");
    expect(m.pollutionIndex).toBe(2);
  });

  it("washes out hardest in a storm (×0.4) and moderately in snow (×0.7)", () => {
    expect(metricsFor(["warehouse", "warehouse"], 12, "storm").pollutionIndex).toBe(1.6);
    expect(metricsFor(["warehouse", "warehouse"], 12, "snow").pollutionIndex).toBe(2.8);
  });

  it("traps emissions in dead-calm fog (×1.2) and dusty haze (×1.35)", () => {
    expect(metricsFor(["warehouse", "warehouse"], 12, "fog").pollutionIndex).toBe(4.8);
    expect(metricsFor(["warehouse", "warehouse"], 12, "haze").pollutionIndex).toBe(5.4);
  });

  it("storms crush solar output (×0.1) and supercharge wind (×1.6)", () => {
    const storm = metricsFor(["solar-panel", "wind-turbine"], 12, "storm");
    const clear = metricsFor(["solar-panel", "wind-turbine"], 12, "clear");
    expect(clear.energyProductionKw).toBeCloseTo(4 * 1 + 12 * 0.4);
    expect(storm.energyProductionKw).toBeCloseTo(4 * 0.1 + 12 * 1.6);
  });

  it("leaves non-industrial sources unaffected by weather", () => {
    const clear = metricsFor(["road", "road"]);
    const rain = metricsFor(["road", "road"], 12, "rain");
    expect(rain.pollutionIndex).toBe(clear.pollutionIndex);
    expect(rain.pollutionIndex).toBe(6);
  });

  it("exposes the multiplier table the heatmap legend renders", () => {
    // The legend imports this table directly (no copy-paste), so locking it
    // here keeps the displayed ×N chips honest.
    expect(WEATHER_POLLUTION_MULTIPLIER).toEqual({
      clear: 1.5,
      cloudy: 1,
      overcast: 1.1,
      rain: 0.5,
      drizzle: 0.6,
      storm: 0.4,
      snow: 0.7,
      fog: 1.2,
      haze: 1.35,
      dust: 1.6,
      windy: 0.6,
    });
  });
});

describe("computeCityMetrics — weather-scaled traffic", () => {
  it("empties the roads in a storm (density ×0.2)", () => {
    const scene: AssetKind[] = ["building-residential", "road", "road", "road"];
    const clear = metricsFor(scene, 12, "clear");
    const storm = metricsFor(scene, 12, "storm");
    expect(storm.vehicleEstimate).toBeCloseTo(clear.vehicleEstimate * 0.2, 5);
    expect(storm.trafficDensity).toBeCloseTo(clear.trafficDensity * 0.2, 5);
  });

  it("leaves most cars parked in snow and dust, but the streets stay busy in haze", () => {
    const scene: AssetKind[] = ["building-residential", "building-commercial", "road", "road"];
    const clear = metricsFor(scene, 12, "clear");
    expect(metricsFor(scene, 12, "snow").trafficDensity).toBeCloseTo(clear.trafficDensity * 0.3, 5);
    expect(metricsFor(scene, 12, "dust").trafficDensity).toBeCloseTo(
      clear.trafficDensity * 0.25,
      5,
    );
    expect(metricsFor(scene, 12, "haze").trafficDensity).toBeCloseTo(clear.trafficDensity * 0.9, 5);
  });

  it("keeps traffic weather-scaling consistent with the 3D cars' density table", () => {
    // The engine multiplies by WEATHER_TRAFFIC.density — the same value the
    // 3D TrafficSimulation uses to hide cars — so chart and street agree.
    const scene: AssetKind[] = ["building-residential", "road"];
    const rain = metricsFor(scene, 12, "rain");
    const clear = metricsFor(scene, 12, "clear");
    expect(rain.trafficDensity).toBeCloseTo(clear.trafficDensity * 0.55, 5);
  });
});

describe("pollutionWeightFor", () => {
  it("exposes per-kind source weights for the heatmap", () => {
    expect(pollutionWeightFor("road", "cloudy")).toBe(3);
    expect(pollutionWeightFor("building-commercial", "cloudy")).toBe(2);
    // Sinks are not sources — the heatmap filters on this.
    expect(pollutionWeightFor("lake", "cloudy")).toBe(0);
    expect(pollutionWeightFor("fountain", "cloudy")).toBe(0);
    expect(pollutionWeightFor("tree", "cloudy")).toBe(0);
  });

  it("scales warehouse weight with weather, matching the index", () => {
    expect(pollutionWeightFor("warehouse", "clear")).toBe(3);
    expect(pollutionWeightFor("warehouse", "cloudy")).toBe(2);
    expect(pollutionWeightFor("warehouse", "rain")).toBe(1);
    expect(pollutionWeightFor("warehouse", "storm")).toBe(0.8);
    expect(pollutionWeightFor("warehouse", "haze")).toBe(2.7);
    expect(pollutionWeightFor("road", "rain")).toBe(3); // weather-agnostic
  });
});
