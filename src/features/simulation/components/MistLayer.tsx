"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { mulberry32 } from "@/lib/random";
import { makeCloudSpriteTexture } from "@/features/simulation/lib/cloudTexture";
import { WEATHER_MIST, WEATHER_WIND } from "@/features/simulation/lib/weatherVisuals";
import { useSimulationStore } from "@/features/simulation/store/useSimulationStore";

interface MistSpot {
  x: number;
  y: number;
  z: number;
  w: number;
  h: number;
  phase: number;
}

// Deterministic, weather-keyed placement so the mist patch reads as a stable
// bank of ground fog rather than random noise.
function mistSpots(count: number, kind: string): MistSpot[] {
  const rand = mulberry32((kind.length * 2654435761) >>> 0);
  const spots: MistSpot[] = [];
  for (let i = 0; i < count; i++) {
    const angle = rand() * Math.PI * 2;
    const radius = 40 + rand() * 240;
    spots.push({
      x: Math.cos(angle) * radius,
      z: Math.sin(angle) * radius,
      y: 3 + rand() * 12,
      w: 140 + rand() * 160,
      h: 26 + rand() * 30,
      phase: rand() * Math.PI * 2,
    });
  }
  return spots;
}

// A low bank of soft ground fog hugging the streets — the visual layer that
// sells a foggy morning or the damp air of a drizzle. Reuses the same
// procedural cloud sprite as the high deck (one texture, tinted and dimmed),
// drifts with the shared wind, and only appears when WEATHER_MIST says so.
export function MistLayer() {
  const weather = useSimulationStore((state) => state.weather);
  const config = WEATHER_MIST[weather];
  const wind = WEATHER_WIND[weather];

  const texture = useMemo(() => makeCloudSpriteTexture(), []);
  const material = useMemo(
    () =>
      new THREE.SpriteMaterial({
        map: texture,
        color: config.color,
        transparent: true,
        opacity: config.opacity,
        depthWrite: false,
        fog: true,
      }),
    [texture, config.color, config.opacity],
  );
  const spots = useMemo(() => mistSpots(config.density, weather), [config.density, weather]);
  const spriteRefs = useRef<(THREE.Sprite | null)[]>([]);

  useEffect(() => () => material.dispose(), [material]);

  useFrame((frame) => {
    const t = frame.clock.elapsedTime;
    for (let i = 0; i < spots.length; i++) {
      const sprite = spriteRefs.current[i];
      const spot = spots[i];
      if (!sprite || !spot) continue;
      sprite.position.x = spot.x + Math.sin(t * 0.03 + spot.phase) * (6 + wind * 2);
      sprite.position.z = spot.z + Math.cos(t * 0.025 + spot.phase * 1.4) * 4;
    }
  });

  if (spots.length === 0) return null;

  return (
    <group>
      {spots.map((spot, index) => (
        <sprite
          key={index}
          ref={(node: THREE.Sprite | null) => {
            spriteRefs.current[index] = node;
          }}
          position={[spot.x, spot.y, spot.z]}
          scale={[spot.w, spot.h, 1]}
          material={material}
        />
      ))}
    </group>
  );
}
