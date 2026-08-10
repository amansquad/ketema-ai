import type { WeatherKind } from "@/features/simulation/store/useSimulationStore";

// One table per visual dimension, keyed by WeatherKind. DayNightController and
// the weather FX components (CloudLayer, Precipitation, LightningFlash,
// MistLayer, WindDust, WeatherSkyTint) all read from here, so each weather's
// "look" lives in exactly one place and the selectors, sky, fog, light, and
// precipitation can never disagree.
//
// A shared WEATHER_WIND drives the whole atmosphere in one direction: clouds
// stream, rain slants, snow drifts, and dust blows — so a windy day feels like
// one coherent air mass instead of several disconnected effects.

export const WEATHER_FOG_COLOR: Record<WeatherKind, string> = {
  clear: "#87ceeb",
  cloudy: "#9aa5ad",
  overcast: "#8f979e",
  rain: "#5c6670",
  drizzle: "#7d8891",
  storm: "#3a4148",
  snow: "#d8e0e6",
  fog: "#c6c9cb",
  haze: "#b8a98c",
  dust: "#a8783f", // brown dust-laden air
  windy: "#b9c3c9",
};

/** Base fog distance at full daylight (scaled down at night). */
export const WEATHER_FOG_FAR: Record<WeatherKind, number> = {
  clear: 950,
  cloudy: 500,
  overcast: 300,
  rain: 280,
  drizzle: 210,
  storm: 240,
  snow: 320,
  fog: 120,
  haze: 420,
  dust: 170, // a dust storm hides the far side of the city
  windy: 460,
};

/** drei <Sky> shader parameters — higher turbidity/rayleigh = milkier dome. */
export const WEATHER_TURBIDITY: Record<WeatherKind, number> = {
  clear: 4,
  cloudy: 9,
  overcast: 14,
  rain: 16,
  drizzle: 15,
  storm: 18,
  snow: 8,
  fog: 22,
  haze: 13,
  dust: 20,
  windy: 8,
};

export const WEATHER_RAYLEIGH: Record<WeatherKind, number> = {
  clear: 1,
  cloudy: 3,
  overcast: 2.5,
  rain: 4,
  drizzle: 3.5,
  storm: 5,
  snow: 3,
  fog: 6,
  haze: 2,
  dust: 4,
  windy: 2,
};

/**
 * Mie scattering: how thick the particulate haze is (coefficient) and how the
 * sun's glare concentrates (directionality, 0 = washed out, 1 = sharp disc).
 * Storms and dust get thick, diffuse haze; clear days get a crisp sun.
 */
export const WEATHER_MIE: Record<WeatherKind, { coefficient: number; directionalG: number }> = {
  clear: { coefficient: 0.005, directionalG: 0.8 },
  cloudy: { coefficient: 0.012, directionalG: 0.6 },
  overcast: { coefficient: 0.03, directionalG: 0.3 },
  rain: { coefficient: 0.02, directionalG: 0.5 },
  drizzle: { coefficient: 0.026, directionalG: 0.45 },
  storm: { coefficient: 0.035, directionalG: 0.4 },
  snow: { coefficient: 0.013, directionalG: 0.55 },
  fog: { coefficient: 0.05, directionalG: 0.35 },
  haze: { coefficient: 0.03, directionalG: 0.7 },
  dust: { coefficient: 0.06, directionalG: 0.45 },
  windy: { coefficient: 0.008, directionalG: 0.7 },
};

/** Directional (sun/moon) light: intensity floor at night + added per unit of daylight. */
export const WEATHER_SUN: Record<WeatherKind, { base: number; day: number }> = {
  clear: { base: 0.16, day: 1.7 },
  cloudy: { base: 0.13, day: 0.85 },
  overcast: { base: 0.1, day: 0.45 }, // flat, diffused gray light
  rain: { base: 0.1, day: 0.5 },
  drizzle: { base: 0.1, day: 0.55 },
  storm: { base: 0.07, day: 0.32 },
  snow: { base: 0.12, day: 0.75 },
  fog: { base: 0.12, day: 0.6 },
  haze: { base: 0.15, day: 1.35 },
  dust: { base: 0.08, day: 0.4 },
  windy: { base: 0.14, day: 1.25 },
};

export const WEATHER_AMBIENT: Record<WeatherKind, { base: number; day: number }> = {
  clear: { base: 0.15, day: 0.45 },
  cloudy: { base: 0.18, day: 0.35 },
  overcast: { base: 0.22, day: 0.5 }, // clouds bounce light everywhere — no hard shadows
  rain: { base: 0.16, day: 0.28 },
  drizzle: { base: 0.17, day: 0.3 },
  storm: { base: 0.12, day: 0.2 },
  snow: { base: 0.2, day: 0.38 }, // snow bounces daylight around
  fog: { base: 0.17, day: 0.3 },
  haze: { base: 0.17, day: 0.4 },
  dust: { base: 0.15, day: 0.25 },
  windy: { base: 0.16, day: 0.4 },
};

/** Sun color at midday; DayNightController lerps it from a shared night blue. */
export const WEATHER_DAY_COLOR: Record<WeatherKind, string> = {
  clear: "#fff6e8",
  cloudy: "#f2f5f8",
  overcast: "#dfe4ea",
  rain: "#b9c8d4",
  drizzle: "#c2cdd4",
  storm: "#8b9bb0",
  snow: "#f4f8ff",
  fog: "#e8e6e0",
  haze: "#ffd9a0",
  dust: "#ffb878", // sun filtered through brown dust
  windy: "#f4f8fc",
};

export type PrecipitationKind = "rain" | "storm" | "drizzle" | "snow" | "none";

/** What falls from the sky (if anything). "storm" = faster, wind-slanted rain. */
export const WEATHER_PRECIPITATION: Record<WeatherKind, PrecipitationKind> = {
  clear: "none",
  cloudy: "none",
  overcast: "none",
  rain: "rain",
  drizzle: "drizzle",
  storm: "storm",
  snow: "snow",
  fog: "none",
  haze: "none",
  dust: "none",
  windy: "none",
};

/**
 * Wind speed blowing along +X, shared by clouds, rain slant, snow drift, and
 * dust. Roughly the Beaufort-ish feel: calm 1 → gale 9-12.
 */
export const WEATHER_WIND: Record<WeatherKind, number> = {
  clear: 1,
  cloudy: 2,
  overcast: 3,
  rain: 4,
  drizzle: 2.5,
  storm: 9,
  snow: 3,
  fog: 1,
  haze: 1.5,
  dust: 12,
  windy: 8,
};

/**
 * Billboard cloud field: count, tint, opacity, and base altitude. Storm decks
 * sit low and dark; fair-weather cumulus ride high and bright; overcast uses a
 * few wide, flat, dense slabs for a uniform gray lid.
 */
export const WEATHER_CLOUDS: Record<
  WeatherKind,
  { count: number; color: string; opacity: number; height: number; flatness: number }
> = {
  clear: { count: 3, color: "#ffffff", opacity: 0.5, height: 150, flatness: 0.4 },
  cloudy: { count: 9, color: "#e6e9ee", opacity: 0.85, height: 120, flatness: 0.42 },
  overcast: { count: 7, color: "#aab3bd", opacity: 0.95, height: 88, flatness: 0.2 }, // flat lid
  rain: { count: 10, color: "#aeb6c0", opacity: 0.9, height: 95, flatness: 0.34 },
  drizzle: { count: 8, color: "#c3ccd4", opacity: 0.85, height: 100, flatness: 0.38 },
  storm: { count: 12, color: "#4a515c", opacity: 0.95, height: 78, flatness: 0.3 },
  snow: { count: 9, color: "#e9eef3", opacity: 0.9, height: 100, flatness: 0.4 },
  fog: { count: 4, color: "#dfe2e4", opacity: 0.35, height: 60, flatness: 0.4 },
  haze: { count: 4, color: "#e8d6b6", opacity: 0.5, height: 120, flatness: 0.42 },
  dust: { count: 2, color: "#a87d4a", opacity: 0.3, height: 55, flatness: 0.3 },
  windy: { count: 7, color: "#eef2f5", opacity: 0.7, height: 130, flatness: 0.4 },
};

export const WEATHER_HAS_LIGHTNING: Record<WeatherKind, boolean> = {
  clear: false,
  cloudy: false,
  overcast: false,
  rain: false,
  drizzle: false,
  storm: true,
  snow: false,
  fog: false,
  haze: false,
  dust: false,
  windy: false,
};

/** Suspended dust motes hanging in the air (drei Sparkles) for dusty days. */
export const WEATHER_HAS_HAZE_DUST: Record<WeatherKind, boolean> = {
  clear: false,
  cloudy: false,
  overcast: false,
  rain: false,
  drizzle: false,
  storm: false,
  snow: false,
  fog: false,
  haze: true,
  dust: true,
  windy: true,
};

/** Low-lying ground mist hugging the streets. */
export const WEATHER_MIST: Record<
  WeatherKind,
  { density: number; color: string; opacity: number }
> = {
  clear: { density: 0, color: "#ffffff", opacity: 0 },
  cloudy: { density: 0, color: "#ffffff", opacity: 0 },
  overcast: { density: 0, color: "#ffffff", opacity: 0 },
  rain: { density: 6, color: "#c9d3da", opacity: 0.22 },
  drizzle: { density: 10, color: "#d3dae0", opacity: 0.3 },
  storm: { density: 5, color: "#8f9aa6", opacity: 0.22 },
  snow: { density: 0, color: "#ffffff", opacity: 0 },
  fog: { density: 14, color: "#e4e6e6", opacity: 0.42 },
  haze: { density: 0, color: "#ffffff", opacity: 0 },
  dust: { density: 4, color: "#b08a55", opacity: 0.28 },
  windy: { density: 0, color: "#ffffff", opacity: 0 },
};

/**
 * Wind-driven ground dust streaming along +X. Dust storms kick up dense brown
 * sheets; windy days get wispy pale swirls at street level.
 */
export const WEATHER_DUST: Record<WeatherKind, { count: number; color: string; opacity: number }> =
  {
    clear: { count: 0, color: "#d8c49a", opacity: 0 },
    cloudy: { count: 0, color: "#d8c49a", opacity: 0 },
    overcast: { count: 0, color: "#d8c49a", opacity: 0 },
    rain: { count: 0, color: "#d8c49a", opacity: 0 },
    drizzle: { count: 0, color: "#d8c49a", opacity: 0 },
    storm: { count: 0, color: "#d8c49a", opacity: 0 },
    snow: { count: 0, color: "#d8c49a", opacity: 0 },
    fog: { count: 0, color: "#d8c49a", opacity: 0 },
    haze: { count: 0, color: "#d8c49a", opacity: 0 },
    dust: { count: 420, color: "#b07d45", opacity: 0.6 },
    windy: { count: 220, color: "#d9c49b", opacity: 0.4 },
  };

/**
 * Full-sky color override rendered as a translucent gradient dome over the
 * physical drei sky, used where the atmospheric shader can't produce the real
 * color of the event: the flat gray lid of an overcast day, the brown wall of
 * a dust storm, the slate of a storm front. { top: zenith, bottom: horizon }.
 */
export const WEATHER_SKY_TINT: Record<
  WeatherKind,
  { top: string; bottom: string; opacity: number } | null
> = {
  clear: null,
  cloudy: null,
  overcast: { top: "#aeb6bf", bottom: "#dde1e6", opacity: 0.9 },
  rain: null,
  drizzle: { top: "#8fa0ad", bottom: "#cdd5db", opacity: 0.5 },
  storm: { top: "#2c333d", bottom: "#59636f", opacity: 0.82 },
  snow: null,
  fog: null,
  haze: null,
  dust: { top: "#7a4a1c", bottom: "#d9a05a", opacity: 0.94 },
  windy: null,
};

/**
 * Vehicles: how fast they drive and how many are on the road, per weather.
 * Rain, storms, snow, fog, and dust all slow traffic and clear the streets —
 * a storm leaves only a fifth of cars out. Drives both the 3D cars and the
 * analytics traffic-density chart (metrics.ts multiplies by `density`), so
 * the two surfaces can never disagree.
 */
export const WEATHER_TRAFFIC: Record<WeatherKind, { speed: number; density: number }> = {
  clear: { speed: 1, density: 1 },
  cloudy: { speed: 1, density: 1 },
  overcast: { speed: 0.9, density: 0.9 },
  rain: { speed: 0.65, density: 0.55 },
  drizzle: { speed: 0.85, density: 0.75 },
  storm: { speed: 0.4, density: 0.2 },
  snow: { speed: 0.45, density: 0.3 },
  fog: { speed: 0.55, density: 0.5 },
  haze: { speed: 0.9, density: 0.9 },
  dust: { speed: 0.5, density: 0.25 },
  windy: { speed: 0.85, density: 0.7 },
};

/**
 * Pedestrians shelter even faster than traffic stops — in storms, snow, and
 * dust almost nobody is walking, and the few who are move slowly.
 */
export const WEATHER_PEDESTRIANS: Record<WeatherKind, { speed: number; density: number }> = {
  clear: { speed: 1, density: 1 },
  cloudy: { speed: 1, density: 1 },
  overcast: { speed: 0.85, density: 0.85 },
  rain: { speed: 0.6, density: 0.4 },
  drizzle: { speed: 0.8, density: 0.65 },
  storm: { speed: 0.35, density: 0.12 },
  snow: { speed: 0.45, density: 0.18 },
  fog: { speed: 0.5, density: 0.4 },
  haze: { speed: 0.85, density: 0.85 },
  dust: { speed: 0.5, density: 0.15 },
  windy: { speed: 0.8, density: 0.55 },
};

/**
 * Deterministic "is this unit out in the current weather?" check shared by the
 * traffic and pedestrian sims: a stable per-unit hash (its phase) compared
 * against the weather's activity density. Both components call this, so the
 * two crowds can never drift apart in how they respond to a storm.
 */
export function isWeatherActive(unitHash: number, density: number): boolean {
  return unitHash / 100 < density;
}

/** Ground tint: snow covers it in white, rain and storms leave it dark and wet. */
export function groundColorFor(weather: WeatherKind): string {
  if (weather === "snow") return "#e7edef";
  if (weather === "dust") return "#a8906b"; // dust settles on everything
  if (
    weather === "rain" ||
    weather === "storm" ||
    weather === "drizzle" ||
    weather === "overcast"
  ) {
    return "#1d2620"; // dark, wet
  }
  return "#26312b";
}

/** Ground specularity: wet asphalt gets a subtle sheen, dry ground stays matte. */
export function groundRoughnessFor(weather: WeatherKind): number {
  if (
    weather === "rain" ||
    weather === "storm" ||
    weather === "drizzle" ||
    weather === "overcast"
  ) {
    return 0.35;
  }
  if (weather === "snow") return 0.8;
  return 1;
}
