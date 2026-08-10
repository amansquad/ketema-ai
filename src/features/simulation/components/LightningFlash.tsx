"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { WEATHER_HAS_LIGHTNING } from "@/features/simulation/lib/weatherVisuals";
import { useSimulationStore } from "@/features/simulation/store/useSimulationStore";

interface BoltState {
  age: number;
  timeToNext: number;
  peak: number;
}

// Random lightning for storms: a point light high over the city that snaps on
// with a double-flicker envelope (main bolt + weaker afterglow) and then stays
// dark until the next bolt. The per-bolt peak and the gap are randomized, so
// no two flashes look identical. decay={0} with a long distance makes the
// flash read as a sky-wide illumination rather than a local glow.
export function LightningFlash() {
  const weather = useSimulationStore((state) => state.weather);
  const active = WEATHER_HAS_LIGHTNING[weather];
  const light = useRef<THREE.PointLight>(null);
  const bolt = useRef<BoltState | null>(null);

  useFrame((_, delta) => {
    const source = light.current;
    if (!source) return;
    if (!bolt.current) {
      // Lazy init on the first frame — Math.random is impure, so it must not
      // run during render (React purity rule).
      bolt.current = { age: Infinity, timeToNext: 1 + Math.random() * 4, peak: 3 };
    }
    if (!active) {
      source.intensity = 0;
      return;
    }
    const state = bolt.current;
    state.age += delta;
    if (state.age > 0.5) {
      state.timeToNext -= delta;
      if (state.timeToNext <= 0) {
        state.age = 0;
        state.peak = 2 + Math.random() * 2.5;
        state.timeToNext = 1.5 + Math.random() * 6;
      }
    }
    const a = state.age;
    const envelope =
      a < 0.02 ? 1.0 : a < 0.05 ? 0.25 : a < 0.09 ? 0.6 : a < 0.15 ? 0.12 : 0;
    source.intensity = state.peak * envelope;
  });

  if (!active) return null;

  return (
    <pointLight ref={light} position={[0, 320, 0]} color="#c8d4ff" intensity={0} distance={1800} decay={0} />
  );
}
