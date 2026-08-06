import type { AssetKind, SceneObject } from "@/features/editor/types";
import type { WeatherKind } from "@/features/simulation/store/useSimulationStore";

// Per-unit constants driving the simulation. Deliberately simple (linear,
// no external data) — this is a planning-tool approximation, not a physical
// simulator. Kept in one place so the dashboard (milestone 6) reads the same
// numbers the 3D heatmap/HUD do.
const POPULATION_PER_RESIDENTIAL = 40;
const JOBS_PER_COMMERCIAL = 25;
const JOBS_PER_CIVIC = 15;
const WATER_LITERS_PER_CAPITA = 130;
const SOLAR_PEAK_KW = 4;
const WIND_PEAK_KW = 12;
const BUILDING_BASE_LOAD_KW: Partial<Record<AssetKind, number>> = {
  "building-residential": 2,
  "building-commercial": 6,
  "building-civic": 4,
  hospital: 15,
  school: 5,
  "water-tank": 1,
};
const STREET_LIGHT_LOAD_KW = 0.15;
const POLLUTION_SOURCE_WEIGHT: Partial<Record<AssetKind, number>> = {
  road: 3,
  "building-commercial": 2,
  "building-civic": 1,
  hospital: 1,
};
const POLLUTION_SINK_WEIGHT: Partial<Record<AssetKind, number>> = {
  tree: -1.5,
  park: -2.5,
};

export function countByKind(objects: SceneObject[]): Record<AssetKind, number> {
  const counts = {} as Record<AssetKind, number>;
  for (const object of objects) {
    counts[object.assetKind] = (counts[object.assetKind] ?? 0) + 1;
  }
  return counts;
}

/** 0 (midnight) .. 1 (noon) .. 0 (midnight again), smooth over a 24h clock. */
export function daylightFactor(hour24: number): number {
  return Math.max(0, Math.sin(((hour24 - 6) / 24) * Math.PI * 2));
}

const WEATHER_SOLAR_MULTIPLIER: Record<WeatherKind, number> = { clear: 1, cloudy: 0.5, rain: 0.25 };
const WEATHER_WIND_MULTIPLIER: Record<WeatherKind, number> = { clear: 0.4, cloudy: 0.7, rain: 1 };

export interface CityMetrics {
  population: number;
  jobs: number;
  energyProductionKw: number;
  energyConsumptionKw: number;
  netEnergyKw: number;
  waterConsumptionLitersPerDay: number;
  pollutionIndex: number; // unbounded-ish score, higher = worse
}

export function computeCityMetrics(objects: SceneObject[], hour24: number, weather: WeatherKind): CityMetrics {
  const counts = countByKind(objects);
  const daylight = daylightFactor(hour24);
  const isNight = daylight < 0.15;

  const population = (counts["building-residential"] ?? 0) * POPULATION_PER_RESIDENTIAL;
  const jobs =
    (counts["building-commercial"] ?? 0) * JOBS_PER_COMMERCIAL + (counts["building-civic"] ?? 0) * JOBS_PER_CIVIC;

  const solarKw =
    (counts["solar-panel"] ?? 0) * SOLAR_PEAK_KW * daylight * WEATHER_SOLAR_MULTIPLIER[weather];
  const windKw = (counts["wind-turbine"] ?? 0) * WIND_PEAK_KW * WEATHER_WIND_MULTIPLIER[weather];
  const energyProductionKw = solarKw + windKw;

  let energyConsumptionKw = 0;
  for (const [kind, load] of Object.entries(BUILDING_BASE_LOAD_KW) as [AssetKind, number][]) {
    energyConsumptionKw += (counts[kind] ?? 0) * load;
  }
  if (isNight) {
    energyConsumptionKw += (counts["street-light"] ?? 0) * STREET_LIGHT_LOAD_KW;
  }

  const waterConsumptionLitersPerDay = population * WATER_LITERS_PER_CAPITA;

  let pollutionIndex = 0;
  for (const [kind, weight] of Object.entries(POLLUTION_SOURCE_WEIGHT) as [AssetKind, number][]) {
    pollutionIndex += (counts[kind] ?? 0) * weight;
  }
  for (const [kind, weight] of Object.entries(POLLUTION_SINK_WEIGHT) as [AssetKind, number][]) {
    pollutionIndex += (counts[kind] ?? 0) * weight;
  }
  pollutionIndex = Math.max(0, pollutionIndex);

  return {
    population,
    jobs,
    energyProductionKw,
    energyConsumptionKw,
    netEnergyKw: energyProductionKw - energyConsumptionKw,
    waterConsumptionLitersPerDay,
    pollutionIndex,
  };
}

/** Per-object pollution contribution, used to weight the heatmap markers. */
export function pollutionWeightFor(assetKind: AssetKind): number {
  return POLLUTION_SOURCE_WEIGHT[assetKind] ?? 0;
}
