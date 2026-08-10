"use client";

import { useTranslation } from "@/features/i18n/lib/useTranslation";
import { WEATHER_POLLUTION_MULTIPLIER } from "@/features/simulation/engine/metrics";
import { intensityColor } from "@/features/simulation/components/PollutionHeatmap";
import { WEATHER_ICONS, weatherLabelFor } from "@/features/simulation/lib/weather";
import { useSimulationStore } from "@/features/simulation/store/useSimulationStore";

// Ramp endpoints derive from the same function the 3D discs use: weight 0
// (weakest) to the clamp ceiling of 4 (darkest), so the ramp and markers are
// always the same colors.
const RAMP_LIGHT = intensityColor(0);
const RAMP_DARK = intensityColor(4);

/**
 * HTML legend for the 3D pollution discs, shown while the heatmap is enabled.
 * Explains the intensity ramp and doubles as a live weather selector: the
 * multiplier chips are driven by the engine's WEATHER_POLLUTION_MULTIPLIER
 * (imported, not copy-pasted) and click to switch weather like the simulation
 * panel does, so the legend can never drift from the simulation math.
 */
export function PollutionHeatmapLegend() {
  const visible = useSimulationStore((state) => state.showPollutionHeatmap);
  const weather = useSimulationStore((state) => state.weather);
  const setWeather = useSimulationStore((state) => state.setWeather);
  const { t } = useTranslation();

  if (!visible) return null;

  return (
    <div className="pointer-events-auto w-64 rounded-lg border border-zinc-800 bg-zinc-900/90 p-3 text-xs shadow-lg backdrop-blur">
      <p className="text-[11px] font-semibold tracking-wide text-zinc-400 uppercase">
        {t.simulation.heatmapTitle}
      </p>

      <div className="mt-2">
        <div
          className="h-2 w-full rounded-full"
          style={{ background: `linear-gradient(to right, ${RAMP_LIGHT}, ${RAMP_DARK})` }}
        />
        <div className="mt-1 flex justify-between text-[10px] text-zinc-500">
          <span>{t.simulation.intensityLow}</span>
          <span>{t.simulation.intensityHigh}</span>
        </div>
      </div>

      <p className="mt-3 border-t border-zinc-800 pt-2.5 leading-snug text-zinc-400">
        {t.simulation.weatherScaling}
      </p>
      <div className="mt-2 grid grid-cols-4 gap-1">
        {WEATHER_ICONS.map(({ kind, Icon }) => {
          const active = weather === kind;
          const label = weatherLabelFor(t.simulation, kind);
          return (
            <button
              key={kind}
              type="button"
              onClick={() => setWeather(kind)}
              title={label}
              aria-pressed={active}
              className={`flex flex-col items-center gap-1 rounded-md py-1.5 transition-colors ${
                active ? "bg-emerald-500 text-zinc-950" : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="text-[10px]">{label}</span>
              <span className={`text-[10px] tabular-nums ${active ? "text-zinc-900" : "text-zinc-500"}`}>
                ×{WEATHER_POLLUTION_MULTIPLIER[kind]}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
