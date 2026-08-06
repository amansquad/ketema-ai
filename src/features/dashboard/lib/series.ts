import { computeCityMetrics } from "@/features/simulation/engine/metrics";
import type { WeatherKind } from "@/features/simulation/store/useSimulationStore";
import type { SceneObject } from "@/features/editor/types";

export interface HourlySample {
  hour: number;
  label: string;
  productionKw: number;
  consumptionKw: number;
  netKw: number;
  trafficDensity: number;
}

/**
 * Samples computeCityMetrics across a 24h clock for the current scene. There
 * is no time-series database — this is a deterministic projection of "how
 * would today's placed assets perform across a full day," recomputed
 * whenever the scene or weather changes. Reused by the dashboard charts.
 */
export function buildDailySeries(objects: SceneObject[], weather: WeatherKind): HourlySample[] {
  const samples: HourlySample[] = [];
  for (let hour = 0; hour < 24; hour += 1) {
    const metrics = computeCityMetrics(objects, hour, weather);
    samples.push({
      hour,
      label: `${hour.toString().padStart(2, "0")}:00`,
      productionKw: Number(metrics.energyProductionKw.toFixed(2)),
      consumptionKw: Number(metrics.energyConsumptionKw.toFixed(2)),
      netKw: Number(metrics.netEnergyKw.toFixed(2)),
      trafficDensity: Number(metrics.trafficDensity.toFixed(2)),
    });
  }
  return samples;
}
