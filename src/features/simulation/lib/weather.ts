import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  Sun,
  SunDim,
  Tornado,
  Wind,
} from "lucide-react";

import type { Dictionary } from "@/features/i18n/locales/dictionary";
import type { WeatherKind } from "@/features/simulation/store/useSimulationStore";

// Shared weather metadata so the simulation panel and the pollution-heatmap
// legend render the same icons for the same kinds — the two weather selectors
// physically can't drift apart.
export const WEATHER_ICONS: { kind: WeatherKind; Icon: typeof Sun }[] = [
  { kind: "clear", Icon: Sun },
  { kind: "cloudy", Icon: CloudSun },
  { kind: "overcast", Icon: Cloud },
  { kind: "rain", Icon: CloudRain },
  { kind: "drizzle", Icon: CloudDrizzle },
  { kind: "storm", Icon: CloudLightning },
  { kind: "snow", Icon: CloudSnow },
  { kind: "fog", Icon: CloudFog },
  { kind: "haze", Icon: SunDim },
  { kind: "dust", Icon: Tornado },
  { kind: "windy", Icon: Wind },
];

// Localized label for a weather kind. The dictionary's `simulation` section is
// keyed by WeatherKind on purpose, so a selector can index it without mapping
// tables that can drift.
export function weatherLabelFor(t: Dictionary["simulation"], kind: WeatherKind): string {
  return t[kind];
}
