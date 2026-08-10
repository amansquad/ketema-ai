"use client";

import { Instance, Instances } from "@react-three/drei";
import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";

import { selectSceneObjects, useEditorStore } from "@/features/editor/store/useEditorStore";
import { pollutionWeightFor } from "@/features/simulation/engine/metrics";
import { useSimulationStore } from "@/features/simulation/store/useSimulationStore";
import type { WeatherKind } from "@/features/simulation/store/useSimulationStore";
import type { SceneObject } from "@/features/editor/types";

interface HeatmapMarker {
  id: string;
  x: number;
  z: number;
  radius: number;
  color: string;
}

// Per-instance alpha isn't supported by drei's Instances (only color is), so
// intensity is conveyed by blending toward a darker red instead of opacity.
// Exported so the heatmap legend can derive its ramp endpoints from the same
// function the discs use — the two surfaces can never disagree on color.
export function intensityColor(weight: number): string {
  const t = Math.min(1, weight / 4);
  const r = Math.round(255 - t * 60);
  const g = Math.round(140 - t * 120);
  const b = Math.round(120 - t * 100);
  return `rgb(${r}, ${g}, ${b})`;
}

function buildMarkers(objects: SceneObject[], weather: WeatherKind): HeatmapMarker[] {
  return objects
    .map((object) => ({ object, weight: pollutionWeightFor(object.assetKind, weather) }))
    .filter(({ weight }) => weight > 0)
    .map(({ object, weight }) => ({
      id: object.id,
      x: object.position[0],
      z: object.position[2],
      radius: 3 + weight * 1.5,
      color: intensityColor(weight),
    }));
}

// Flat translucent red discs over pollution sources (roads, commercial/civic
// buildings, hospitals, warehouses) — a lightweight stand-in for a full
// density-field heatmap, toggled from the simulation control panel.
// Warehouse discs scale with the weather: stagnant clear air makes them
// bigger and redder, rain shrinks them.
export function PollutionHeatmap() {
  const visible = useSimulationStore((state) => state.showPollutionHeatmap);
  const weather = useSimulationStore((state) => state.weather);
  const objects = useEditorStore(useShallow(selectSceneObjects));
  const markers = useMemo(() => buildMarkers(objects, weather), [objects, weather]);

  if (!visible || markers.length === 0) return null;

  return (
    <Instances limit={markers.length} range={markers.length}>
      <circleGeometry args={[1, 24]} />
      <meshBasicMaterial transparent opacity={0.35} depthWrite={false} />
      {markers.map((marker) => (
        <Instance
          key={marker.id}
          position={[marker.x, 0.12, marker.z]}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={[marker.radius, marker.radius, 1]}
          color={marker.color}
        />
      ))}
    </Instances>
  );
}
