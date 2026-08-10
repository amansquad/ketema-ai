"use client";

import { motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import { useMemo, type ReactNode } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useShallow } from "zustand/react/shallow";

import { selectSceneObjects, useEditorStore } from "@/features/editor/store/useEditorStore";
import { buildAssetMix } from "@/features/dashboard/lib/assetMix";
import { buildDailySeries } from "@/features/dashboard/lib/series";
import { computeCityMetrics } from "@/features/simulation/engine/metrics";
import { useSimulationStore } from "@/features/simulation/store/useSimulationStore";

// Palette validated with the dataviz skill's checker against this dark
// surface (#1a1a19-class): worst adjacent CVD ΔE 9.4, normal-vision ΔE 26.5.
const COLOR_PRODUCTION = "#199e70";
const COLOR_CONSUMPTION = "#d95926";
const COLOR_TRAFFIC = "#3987e5";
const COLOR_GRID = "#2c2c2a";
const COLOR_AXIS = "#898781";
const COLOR_SURFACE = "#1a1a19";

const tooltipStyle = {
  background: COLOR_SURFACE,
  border: "1px solid #383835",
  borderRadius: 8,
  fontSize: 12,
  color: "#ffffff",
};

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2.5">
      <p className="text-[11px] text-zinc-500">{label}</p>
      <p className="mt-0.5 text-lg font-semibold text-zinc-100">{value}</p>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4">
      <p className="mb-3 text-xs font-semibold tracking-wide text-zinc-400 uppercase">{title}</p>
      <div className="h-56 w-full">{children}</div>
    </div>
  );
}

export function AnalyticsOverlay({ onClose }: { onClose: () => void }) {
  const objects = useEditorStore(useShallow(selectSceneObjects));
  const hour24 = useSimulationStore((state) => state.hour24);
  const weather = useSimulationStore((state) => state.weather);
  const prefersReducedMotion = useReducedMotion();

  const metrics = useMemo(() => computeCityMetrics(objects, hour24, weather), [objects, hour24, weather]);
  const series = useMemo(() => buildDailySeries(objects, weather), [objects, weather]);
  const assetMix = useMemo(() => buildAssetMix(objects), [objects]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
      initial={prefersReducedMotion ? undefined : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15 }}
    >
      <motion.div
        className="max-h-[calc(100dvh-2rem)] w-full max-w-4xl overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-950 p-5 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
        initial={prefersReducedMotion ? undefined : { opacity: 0, scale: 0.97, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-50">City analytics</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-white"
            aria-label="Close analytics"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
          <StatTile label="Residents" value={metrics.residents.toLocaleString()} />
          <StatTile label="Event capacity" value={metrics.eventVisitors.toLocaleString()} />
          <StatTile label="Jobs" value={metrics.jobs.toLocaleString()} />
          <StatTile label="Net energy" value={`${metrics.netEnergyKw.toFixed(1)} kW`} />
          <StatTile label="Water / day" value={`${Math.round(metrics.waterConsumptionLitersPerDay / 1000)} m³`} />
          <StatTile label="Pollution index" value={metrics.pollutionIndex.toFixed(1)} />
          <StatTile label="Roads" value={metrics.roadCount.toString()} />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <ChartCard title="Power generation vs consumption (24h)">
            <ResponsiveContainer>
              <LineChart data={series} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid stroke={COLOR_GRID} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: COLOR_AXIS, fontSize: 11 }} interval={3} axisLine={{ stroke: COLOR_GRID }} tickLine={false} />
                <YAxis tick={{ fill: COLOR_AXIS, fontSize: 11 }} axisLine={false} tickLine={false} width={40} />
                <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: COLOR_AXIS }} />
                <Legend wrapperStyle={{ fontSize: 11, color: COLOR_AXIS }} />
                <Line type="monotone" dataKey="productionKw" name="Production (kW)" stroke={COLOR_PRODUCTION} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="consumptionKw" name="Consumption (kW)" stroke={COLOR_CONSUMPTION} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Traffic density (24h)">
            <ResponsiveContainer>
              <AreaChart data={series} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="trafficFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={COLOR_TRAFFIC} stopOpacity={0.4} />
                    <stop offset="100%" stopColor={COLOR_TRAFFIC} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={COLOR_GRID} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: COLOR_AXIS, fontSize: 11 }} interval={3} axisLine={{ stroke: COLOR_GRID }} tickLine={false} />
                <YAxis tick={{ fill: COLOR_AXIS, fontSize: 11 }} axisLine={false} tickLine={false} width={40} />
                <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: COLOR_AXIS }} />
                <Area type="monotone" dataKey="trafficDensity" name="Vehicles / road" stroke={COLOR_TRAFFIC} fill="url(#trafficFill)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Asset mix">
            <ResponsiveContainer>
              <BarChart data={assetMix} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
                <CartesianGrid stroke={COLOR_GRID} strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tick={{ fill: COLOR_AXIS, fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis
                  type="category"
                  dataKey="label"
                  tick={{ fill: COLOR_AXIS, fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={130}
                />
                <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: COLOR_AXIS }} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
                <Bar dataKey="count" name="Count" fill={COLOR_PRODUCTION} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Net energy (24h)">
            <ResponsiveContainer>
              <LineChart data={series} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid stroke={COLOR_GRID} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: COLOR_AXIS, fontSize: 11 }} interval={3} axisLine={{ stroke: COLOR_GRID }} tickLine={false} />
                <YAxis tick={{ fill: COLOR_AXIS, fontSize: 11 }} axisLine={false} tickLine={false} width={40} />
                <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: COLOR_AXIS }} />
                <Line type="monotone" dataKey="netKw" name="Net (kW)" stroke={COLOR_PRODUCTION} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </motion.div>
    </motion.div>
  );
}
