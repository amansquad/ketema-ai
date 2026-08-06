"use client";

import { Cloud, CloudRain, Droplet, Gauge, Pause, Play, Sun, Users, Zap } from "lucide-react";
import { useMemo, useState } from "react";
import { useShallow } from "zustand/react/shallow";

import { selectSceneObjects, useEditorStore } from "@/features/editor/store/useEditorStore";
import { computeCityMetrics } from "@/features/simulation/engine/metrics";
import { useSimulationStore, type WeatherKind } from "@/features/simulation/store/useSimulationStore";

const WEATHER_OPTIONS: { kind: WeatherKind; label: string; Icon: typeof Sun }[] = [
  { kind: "clear", label: "Clear", Icon: Sun },
  { kind: "cloudy", label: "Cloudy", Icon: Cloud },
  { kind: "rain", label: "Rain", Icon: CloudRain },
];

function formatHour(hour24: number): string {
  const hours = Math.floor(hour24);
  const minutes = Math.floor((hour24 - hours) * 60);
  const period = hours >= 12 ? "PM" : "AM";
  const displayHour = hours % 12 === 0 ? 12 : hours % 12;
  return `${displayHour}:${minutes.toString().padStart(2, "0")} ${period}`;
}

export function SimulationControlPanel() {
  const [collapsed, setCollapsed] = useState(false);

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

  const objects = useEditorStore(useShallow(selectSceneObjects));
  const metrics = useMemo(() => computeCityMetrics(objects, hour24, weather), [objects, hour24, weather]);

  if (collapsed) {
    return (
      <button
        type="button"
        onClick={() => setCollapsed(false)}
        className="pointer-events-auto flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/90 px-3 py-2 text-xs font-medium text-zinc-300 shadow-lg backdrop-blur hover:bg-zinc-800 hover:text-white"
      >
        <Gauge className="h-3.5 w-3.5" />
        Simulation
      </button>
    );
  }

  return (
    <div className="pointer-events-auto w-72 rounded-lg border border-zinc-800 bg-zinc-900/90 shadow-lg backdrop-blur">
      <button
        type="button"
        onClick={() => setCollapsed(true)}
        className="flex w-full items-center justify-between border-b border-zinc-800 px-3 py-2.5 text-xs font-semibold tracking-wide text-zinc-400 uppercase hover:text-white"
      >
        <span>Simulation</span>
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
        <span className="w-16 text-right text-xs text-zinc-400 tabular-nums">{formatHour(hour24)}</span>
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

      <div className="flex gap-1 px-3 pb-2.5">
        {WEATHER_OPTIONS.map(({ kind, label, Icon }) => (
          <button
            key={kind}
            type="button"
            onClick={() => setWeather(kind)}
            title={label}
            className={`flex flex-1 items-center justify-center gap-1 rounded-md py-1.5 text-xs transition-colors ${
              weather === kind ? "bg-emerald-500 text-zinc-950" : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      <label className="flex items-center gap-2 border-t border-zinc-800 px-3 py-2.5 text-xs text-zinc-400">
        <input type="checkbox" checked={showHeatmap} onChange={toggleHeatmap} className="accent-emerald-500" />
        Show pollution heatmap
      </label>

      <div className="grid grid-cols-2 gap-2 border-t border-zinc-800 px-3 py-2.5 text-xs">
        <Stat icon={Users} label="Population" value={metrics.population.toLocaleString()} />
        <Stat icon={Users} label="Jobs" value={metrics.jobs.toLocaleString()} />
        <Stat icon={Zap} label="Energy net" value={`${metrics.netEnergyKw.toFixed(1)} kW`} />
        <Stat icon={Droplet} label="Water/day" value={`${Math.round(metrics.waterConsumptionLitersPerDay / 1000)} m³`} />
      </div>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Sun;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-md bg-zinc-800/60 px-2 py-1.5">
      <Icon className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
      <div className="min-w-0">
        <p className="truncate text-zinc-500">{label}</p>
        <p className="truncate font-medium text-zinc-100">{value}</p>
      </div>
    </div>
  );
}
