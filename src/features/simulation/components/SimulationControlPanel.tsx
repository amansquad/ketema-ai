"use client";

import { Dices, Droplet, Gauge, Pause, Play, Sun, Users, Zap } from "lucide-react";
import { useMemo, useState } from "react";
import { useShallow } from "zustand/react/shallow";

import { selectSceneObjects, useEditorStore } from "@/features/editor/store/useEditorStore";
import type { Dictionary } from "@/features/i18n/locales/dictionary";
import { useTranslation } from "@/features/i18n/lib/useTranslation";
import { computeCityMetrics } from "@/features/simulation/engine/metrics";
import { WEATHER_ICONS, weatherLabelFor } from "@/features/simulation/lib/weather";
import { seasonForDay, type SeasonKind } from "@/features/simulation/lib/weatherSchedule";
import { useSimulationStore } from "@/features/simulation/store/useSimulationStore";

// Localized label key for each season, so the chip reads the dictionary the
// same way the weather selectors do (keyed lookups, no drift).
const SEASON_LABEL_KEY: Record<SeasonKind, keyof Dictionary["simulation"]> = {
  kiremt: "seasonKiremt",
  tseday: "seasonTseday",
  bega: "seasonBega",
  belg: "seasonBelg",
};

function formatHour(hour24: number): string {
  const hours = Math.floor(hour24);
  const minutes = Math.floor((hour24 - hours) * 60);
  const period = hours >= 12 ? "PM" : "AM";
  const displayHour = hours % 12 === 0 ? 12 : hours % 12;
  return `${displayHour}:${minutes.toString().padStart(2, "0")} ${period}`;
}

export function SimulationControlPanel() {
  const [collapsed, setCollapsed] = useState(false);
  const { t } = useTranslation();

  const running = useSimulationStore((state) => state.running);
  const hour24 = useSimulationStore((state) => state.hour24);
  const speed = useSimulationStore((state) => state.speedHoursPerSecond);
  const weather = useSimulationStore((state) => state.weather);
  const showHeatmap = useSimulationStore((state) => state.showPollutionHeatmap);
  const toggleRunning = useSimulationStore((state) => state.toggleRunning);
  const setHour = useSimulationStore((state) => state.setHour);
  const setSpeed = useSimulationStore((state) => state.setSpeed);
  const setWeather = useSimulationStore((state) => state.setWeather);
  const toggleHeatmap = useSimulationStore((state) => state.toggleHeatmap);
  const dayOfYear = useSimulationStore((state) => state.dayOfYear);
  const autoWeather = useSimulationStore((state) => state.autoWeather);
  const randomizeWeather = useSimulationStore((state) => state.randomizeWeather);
  const setAutoWeather = useSimulationStore((state) => state.setAutoWeather);

  const season = seasonForDay(dayOfYear);

  const objects = useEditorStore(useShallow(selectSceneObjects));
  const metrics = useMemo(
    () => computeCityMetrics(objects, hour24, weather),
    [objects, hour24, weather],
  );

  if (collapsed) {
    return (
      <button
        type="button"
        onClick={() => setCollapsed(false)}
        className="pointer-events-auto flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/90 px-3 py-2 text-xs font-medium text-zinc-300 shadow-lg backdrop-blur hover:bg-zinc-800 hover:text-white"
      >
        <Gauge className="h-3.5 w-3.5" />
        {t.simulation.title}
      </button>
    );
  }

  return (
    <div className="pointer-events-auto w-72 max-w-[calc(100vw-2rem)] rounded-lg border border-zinc-800 bg-zinc-900/90 shadow-lg backdrop-blur">
      <button
        type="button"
        onClick={() => setCollapsed(true)}
        className="flex w-full items-center justify-between border-b border-zinc-800 px-3 py-2.5 text-xs font-semibold tracking-wide text-zinc-400 uppercase hover:text-white"
      >
        <span>{t.simulation.title}</span>
        <span aria-hidden>×</span>
      </button>

      <div className="flex items-center justify-between gap-2 px-3 py-2.5">
        <button
          type="button"
          onClick={toggleRunning}
          title={running ? "Pause" : "Play"}
          className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-500 text-zinc-950 hover:bg-emerald-400"
        >
          {running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </button>
        <input
          type="range"
          min={0}
          max={24}
          step={0.1}
          value={hour24}
          onChange={(event) => setHour(event.target.valueAsNumber)}
          className="flex-1 accent-emerald-500"
        />
        <span className="w-16 text-right text-xs text-zinc-400 tabular-nums">
          {formatHour(hour24)}
        </span>
      </div>

      <div className="flex items-center gap-2 px-3 pb-2.5">
        <span className="text-[11px] text-zinc-500">Speed</span>
        <input
          type="range"
          min={0}
          max={2}
          step={0.05}
          value={speed}
          onChange={(event) => setSpeed(event.target.valueAsNumber)}
          className="flex-1 accent-emerald-500"
        />
      </div>

      {/* Random weather, the current season (drives auto-weather odds), and
          the auto-weather toggle. */}
      <div className="flex items-center gap-1.5 border-t border-zinc-800 px-3 py-2">
        <button
          type="button"
          onClick={randomizeWeather}
          title={t.simulation.randomWeather}
          className="flex h-7 shrink-0 items-center gap-1.5 rounded-md bg-zinc-800 px-2 text-[11px] font-medium text-zinc-300 transition-colors hover:bg-zinc-700 hover:text-white"
        >
          <Dices className="h-3.5 w-3.5" />
          {t.simulation.randomWeather}
        </button>
        <span className="min-w-0 truncate rounded-md bg-zinc-800/60 px-2 py-1 text-[10px] text-zinc-400">
          {t.simulation.seasonLabel}:{" "}
          <span className="font-medium text-emerald-400">
            {t.simulation[SEASON_LABEL_KEY[season]]}
          </span>
        </span>
        <label
          className="ml-auto flex shrink-0 items-center gap-1 text-[11px] text-zinc-400"
          title={t.simulation.autoWeather}
        >
          <input
            type="checkbox"
            checked={autoWeather}
            onChange={(event) => setAutoWeather(event.target.checked)}
            className="accent-emerald-500"
          />
          {t.simulation.autoWeather}
        </label>
      </div>

      <div className="grid grid-cols-4 gap-1 px-3 pb-2.5">
        {WEATHER_ICONS.map(({ kind, Icon }) => {
          const label = weatherLabelFor(t.simulation, kind);
          const active = weather === kind;
          return (
            <button
              key={kind}
              type="button"
              onClick={() => setWeather(kind)}
              title={label}
              aria-pressed={active}
              className={`flex flex-col items-center gap-0.5 rounded-md py-1.5 text-[10px] transition-colors ${
                active
                  ? "bg-emerald-500 text-zinc-950"
                  : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          );
        })}
      </div>

      <label className="flex items-center gap-2 border-t border-zinc-800 px-3 py-2.5 text-xs text-zinc-400">
        <input
          type="checkbox"
          checked={showHeatmap}
          onChange={toggleHeatmap}
          className="accent-emerald-500"
        />
        {t.simulation.showHeatmap}
      </label>

      <div className="grid grid-cols-2 gap-2 border-t border-zinc-800 px-3 py-2.5 text-xs">
        <Stat
          icon={Users}
          label={t.simulation.residents}
          value={metrics.residents.toLocaleString()}
        />
        <Stat
          icon={Users}
          label={t.simulation.eventCapacity}
          value={metrics.eventVisitors.toLocaleString()}
        />
        <Stat icon={Users} label={t.simulation.jobs} value={metrics.jobs.toLocaleString()} />
        <Stat
          icon={Zap}
          label={t.simulation.energyNet}
          value={`${metrics.netEnergyKw.toFixed(1)} kW`}
        />
        <Stat
          icon={Droplet}
          label={t.simulation.waterPerDay}
          value={`${Math.round(metrics.waterConsumptionLitersPerDay / 1000)} m³`}
          className="col-span-2"
        />
      </div>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  className,
}: {
  icon: typeof Sun;
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div
      className={`flex items-center gap-2 rounded-md bg-zinc-800/60 px-2 py-1.5 ${className ?? ""}`}
    >
      <Icon className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
      <div className="min-w-0">
        <p className="truncate text-zinc-500">{label}</p>
        <p className="truncate font-medium text-zinc-100">{value}</p>
      </div>
    </div>
  );
}
