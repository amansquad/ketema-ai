import type { AssetKind, SceneObject } from "@/features/editor/types";
import { WEATHER_TRAFFIC } from "@/features/simulation/lib/weatherVisuals";
import type { WeatherKind } from "@/features/simulation/store/useSimulationStore";

// Per-unit constants driving the simulation. Deliberately simple (linear,
// no external data) — this is a planning-tool approximation, not a physical
// simulator. Kept in one place so the dashboard (milestone 6) reads the same
// numbers the 3D heatmap/HUD do.
const POPULATION_PER_RESIDENTIAL = 40;
const JOBS_PER_COMMERCIAL = 25;
const JOBS_PER_CIVIC = 15;
const JOBS_PER_WAREHOUSE = 12; // logistics/industrial jobs
const JOBS_PER_MARKET_STALL = 4; // one or two traders per stall
const JOBS_PER_GRAIN_SILO = 8; // milling/storage crew
const JOBS_PER_RAILWAY_STATION = 20; // terminal staff
const JOBS_PER_POLICE_STATION = 10; // officers/staff on shift
const JOBS_PER_UNIVERSITY = 30; // faculty and staff, bigger than a school
const JOBS_PER_COFFEE_CEREMONY = 2; // one or two hosts per pavilion
const STADIUM_VISITOR_CAPACITY = 600; // event-day visitors, not residents
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
  "market-stall": 0.5,
  "clock-tower": 0.3,
  "bus-station": 1,
  "railway-station": 6,
  "police-station": 4,
  university: 8,
  substation: 2, // auxiliary yard systems, not grid throughput
  "coffee-ceremony": 0.3,
  "telecom-tower": 3,
};
const STREET_LIGHT_LOAD_KW = 0.15;
const POLLUTION_SOURCE_WEIGHT: Partial<Record<AssetKind, number>> = {
  road: 3,
  "building-commercial": 2,
  "building-civic": 1,
  hospital: 1,
  warehouse: 2, // industrial emissions
  "bus-station": 1.5, // idling diesel minibuses
  "grain-silo": 1, // milling dust/emissions
  "railway-station": 1.5, // diesel rail traffic
  "car-park": 0.8, // idling exhaust
};
// Vegetation and open water clean the air: trees, parks, and the water
// features added in the expanded catalog (fountains are modest, lakes are
// large blue-space sinks).
const POLLUTION_SINK_WEIGHT: Partial<Record<AssetKind, number>> = {
  tree: -1.5,
  park: -2.5,
  fountain: -0.75,
  lake: -2,
  "farm-field": -1, // open cultivated land, less filtering than a park
};
// Industrial emissions are weather-sensitive: clear, stagnant high-pressure
// air traps particulates (worse), while rain scrubs them out of the sky
// (better). Other sources (traffic, commercial) keep a fixed weight for now.
// Exported so the heatmap legend can render the live multipliers next to
// each weather chip — the UI physically can't drift from the engine math.
export const WEATHER_POLLUTION_MULTIPLIER: Record<WeatherKind, number> = {
  clear: 1.5, // stagnant, inverted air
  cloudy: 1, // neutral baseline
  overcast: 1.1, // calm, lid-like air barely disperses
  rain: 0.5, // precipitation washout
  drizzle: 0.6, // light washout
  storm: 0.4, // heavy washout + wind dispersal
  snow: 0.7, // light washout
  fog: 1.2, // dead-calm air traps particulates
  haze: 1.35, // dusty, stagnant highland air
  dust: 1.6, // dust storm: the worst air of all
  windy: 0.6, // strong winds blow it away
};

/**
 * Source weight for one object of `kind`, including the weather scaling for
 * industrial emissions. Shared by the index and the heatmap so the two
 * surfaces can never disagree.
 */
function sourceWeightFor(assetKind: AssetKind, weather: WeatherKind): number {
  const base = POLLUTION_SOURCE_WEIGHT[assetKind] ?? 0;
  if (assetKind !== "warehouse") return base;
  return base * WEATHER_POLLUTION_MULTIPLIER[weather];
}

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

const WEATHER_SOLAR_MULTIPLIER: Record<WeatherKind, number> = {
  clear: 1,
  cloudy: 0.5,
  overcast: 0.15, // thick uniform deck
  rain: 0.25,
  drizzle: 0.2,
  storm: 0.1, // thick cloud deck
  snow: 0.3,
  fog: 0.4,
  haze: 0.75, // dusty but still bright
  dust: 0.5, // brown wall blocks a lot of direct sun
  windy: 0.8,
};
const WEATHER_WIND_MULTIPLIER: Record<WeatherKind, number> = {
  clear: 0.4,
  cloudy: 0.7,
  overcast: 0.8,
  rain: 1,
  drizzle: 0.9,
  storm: 1.6, // gale-force gusts
  snow: 0.9,
  fog: 0.6,
  haze: 0.5,
  dust: 1.4,
  windy: 1.8,
};

export interface CityMetrics {
  population: number; // residents + event-day visitors (the headline total)
  residents: number; // residents only, from housing
  eventVisitors: number; // stadium event-day capacity, not residents
  jobs: number;
  energyProductionKw: number;
  energyConsumptionKw: number;
  netEnergyKw: number;
  waterConsumptionLitersPerDay: number;
  pollutionIndex: number; // unbounded-ish score, higher = worse
  roadCount: number;
  vehicleEstimate: number;
  trafficDensity: number; // vehicles per road segment — a congestion proxy
}

export function computeCityMetrics(
  objects: SceneObject[],
  hour24: number,
  weather: WeatherKind,
): CityMetrics {
  const counts = countByKind(objects);
  const daylight = daylightFactor(hour24);
  const isNight = daylight < 0.15;

  // Residents (housing) plus event-day stadium capacity. Water is metered from
  // residents only — visitors don't consume residential water — but both groups
  // generate traffic (see vehicleEstimate below).
  const residentPopulation = (counts["building-residential"] ?? 0) * POPULATION_PER_RESIDENTIAL;
  const eventPopulation = (counts.stadium ?? 0) * STADIUM_VISITOR_CAPACITY;
  const population = residentPopulation + eventPopulation;
  const jobs =
    (counts["building-commercial"] ?? 0) * JOBS_PER_COMMERCIAL +
    (counts["building-civic"] ?? 0) * JOBS_PER_CIVIC +
    (counts.warehouse ?? 0) * JOBS_PER_WAREHOUSE +
    (counts["market-stall"] ?? 0) * JOBS_PER_MARKET_STALL +
    (counts["grain-silo"] ?? 0) * JOBS_PER_GRAIN_SILO +
    (counts["railway-station"] ?? 0) * JOBS_PER_RAILWAY_STATION +
    (counts["police-station"] ?? 0) * JOBS_PER_POLICE_STATION +
    (counts.university ?? 0) * JOBS_PER_UNIVERSITY +
    (counts["coffee-ceremony"] ?? 0) * JOBS_PER_COFFEE_CEREMONY;

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

  const waterConsumptionLitersPerDay = residentPopulation * WATER_LITERS_PER_CAPITA;

  let pollutionIndex = 0;
  for (const kind of Object.keys(POLLUTION_SOURCE_WEIGHT) as AssetKind[]) {
    pollutionIndex += (counts[kind] ?? 0) * sourceWeightFor(kind, weather);
  }
  for (const [kind, weight] of Object.entries(POLLUTION_SINK_WEIGHT) as [AssetKind, number][]) {
    pollutionIndex += (counts[kind] ?? 0) * weight;
  }
  pollutionIndex = Math.max(0, pollutionIndex);

  // Rough trip-generation model: a fraction of residents/workers are "on the
  // road" at once, peaking at commute hours (roughly following daylight). Bad
  // weather empties the streets — the same WEATHER_TRAFFIC.density the 3D cars
  // use, so the analytics chart and the visible traffic never disagree.
  const roadCount = counts.road ?? 0;
  const commuteFactor = 0.15 + daylight * 0.35;
  const vehicleEstimate =
    (population * 0.06 + jobs * 0.1) * commuteFactor * WEATHER_TRAFFIC[weather].density;
  const trafficDensity = vehicleEstimate / Math.max(1, roadCount);

  return {
    population,
    residents: residentPopulation,
    eventVisitors: eventPopulation,
    jobs,
    energyProductionKw,
    energyConsumptionKw,
    netEnergyKw: energyProductionKw - energyConsumptionKw,
    waterConsumptionLitersPerDay,
    pollutionIndex,
    roadCount,
    vehicleEstimate,
    trafficDensity,
  };
}

/**
 * Per-object pollution contribution, used to weight the heatmap markers.
 * Warehouse emissions follow the same weather scaling as the index, so the
 * heatmap and the analytics overlay never disagree.
 */
export function pollutionWeightFor(assetKind: AssetKind, weather: WeatherKind): number {
  return sourceWeightFor(assetKind, weather);
}
