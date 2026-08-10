"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { mulberry32 } from "@/lib/random";
import { makeCloudSpriteTexture } from "@/features/simulation/lib/cloudTexture";
import { WEATHER_CLOUDS, WEATHER_WIND } from "@/features/simulation/lib/weatherVisuals";
import { useSimulationStore } from "@/features/simulation/store/useSimulationStore";

interface CloudSpot {
  x: number;
  y: number;
  z: number;
  w: number;
  h: number;
  phase: number;
  drift: number;
}

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) | 0;
  }
  return hash;
}

/**
 * Deterministic per weather-kind cloud placement (mulberry32 seeded from the
 * kind), so the field is stable while a weather is active and visibly
 * different between kinds. Clouds orbit the scene at high altitude, sized in
 * proportion to their distance from the center and flattened by the weather's
 * `flatness` (overcast lids are wide and squat, cumulus are taller).
 */
function cloudSpots(
  count: number,
  kind: string,
  baseHeight: number,
  flatness: number,
): CloudSpot[] {
  const rand = mulberry32((hashString(kind) ^ 0x9e3779b9) >>> 0);
  const spots: CloudSpot[] = [];
  for (let i = 0; i < count; i++) {
    const angle = rand() * Math.PI * 2;
    const radius = 60 + rand() * 330;
    const width = 110 + rand() * 170;
    spots.push({
      x: Math.cos(angle) * radius,
      z: Math.sin(angle) * radius,
      y: baseHeight + rand() * 60,
      w: width,
      h: width * (flatness + rand() * 0.26),
      phase: rand() * Math.PI * 2,
      drift: 0.6 + rand() * 0.8,
    });
  }
  return spots;
}

// A slowly drifting field of soft billboard clouds rendered as camera-facing
// sprites with a procedural puffy texture (no network assets — drei's built-in
// Cloud fetches its texture from a CDN, which would break offline and hard-
// fail the whole canvas). Density, tint, opacity, altitude, and how hard the
// wind shoves them all come from WEATHER_CLOUDS / WEATHER_WIND — heavy dark
// decks for storms, sparse bright puffs for clear days, and gale-driven
// streaks for windy or dusty weather.
export function CloudLayer() {
  const weather = useSimulationStore((state) => state.weather);
  const config = WEATHER_CLOUDS[weather];
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
  const spots = useMemo(
    () => cloudSpots(config.count, weather, config.height, config.flatness),
    [config.count, config.height, config.flatness, weather],
  );
  const spriteRefs = useRef<(THREE.Sprite | null)[]>([]);

  useEffect(() => () => material.dispose(), [material]);

  // Each cloud drifts downwind (along +X, matching rain slant and dust) with
  // an amplitude that scales with WEATHER_WIND, plus a small idle wander — so
  // a calm day has lazy cumulus and a gale visibly shoves the whole deck.
  useFrame((frame) => {
    const t = frame.clock.elapsedTime;
    const gust = wind * 0.05;
    const amplitude = 8 + wind * 4;
    for (let i = 0; i < spots.length; i++) {
      const sprite = spriteRefs.current[i];
      const spot = spots[i];
      if (!sprite || !spot) continue;
      sprite.position.x = spot.x + Math.sin(t * gust + spot.phase) * amplitude * spot.drift;
      sprite.position.z = spot.z + Math.cos(t * 0.04 + spot.phase * 1.7) * 5;
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
