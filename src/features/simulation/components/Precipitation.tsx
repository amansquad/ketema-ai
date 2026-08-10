"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

import { mulberry32 } from "@/lib/random";
import { makeSoftParticleTexture } from "@/features/simulation/lib/cloudTexture";
import { WEATHER_PRECIPITATION, WEATHER_WIND } from "@/features/simulation/lib/weatherVisuals";
import { useSimulationStore } from "@/features/simulation/store/useSimulationStore";

const EXTENT_X = 300;
const EXTENT_Z = 300;
const RAIN_MAX_Y = 150;
const SNOW_MAX_Y = 130;
const SNOW_SPEED = 2.6;

// Per-precipitation-mode tuning. Wind slant comes from the shared WEATHER_WIND
// table so rain leans the same way the clouds stream and the dust blows.
interface RainModeConfig {
  count: number;
  length: number;
  width: number;
  fall: number;
  opacity: number;
  color: string;
  windScale: number;
}

const RAIN_MODES: Record<"rain" | "storm" | "drizzle", RainModeConfig> = {
  rain: {
    count: 900,
    length: 1.1,
    width: 0.07,
    fall: 36,
    opacity: 0.72,
    color: "#a9c4de",
    windScale: 0.9,
  },
  storm: {
    count: 1100,
    length: 1.5,
    width: 0.08,
    fall: 52,
    opacity: 0.8,
    color: "#9db4cc",
    windScale: 2,
  },
  // Drizzle is a fine, slow, half-invisible mist — short thin streaks at low
  // opacity that hang in the air rather than lashing down.
  drizzle: {
    count: 650,
    length: 0.45,
    width: 0.05,
    fall: 15,
    opacity: 0.45,
    color: "#c4d2de",
    windScale: 0.5,
  },
};

interface DropField {
  position: Float32Array;
  speed: Float32Array;
  dummy: THREE.Object3D;
}

// Both instanced systems live in a group that follows the camera's X/Z so
// precipitation always surrounds the viewer, and every drop/flake recycles to
// the top of the volume when it passes the ground. Rain streaks are long thin
// boxes slanted by the shared wind; snow is instanced soft-textured planes
// with per-flake size and sinusoidal drift. All materials are unlit (basic) so
// precipitation stays clearly visible at night and through fog.
export function Precipitation() {
  const weather = useSimulationStore((state) => state.weather);
  const precipitation = WEATHER_PRECIPITATION[weather];
  const isRain =
    precipitation === "rain" || precipitation === "storm" || precipitation === "drizzle";
  const isSnow = precipitation === "snow";

  return (
    <group>
      {/* key remounts the field when the rain mode changes so the lazily-
          initialized drop arrays are always sized for the active mode. */}
      {isRain && (
        <RainField key={precipitation} mode={precipitation as "rain" | "storm" | "drizzle"} />
      )}
      {isSnow && <SnowFall />}
    </group>
  );
}

function RainField({ mode }: { mode: "rain" | "storm" | "drizzle" }) {
  const config = RAIN_MODES[mode];
  const group = useRef<THREE.Group>(null);
  const mesh = useRef<THREE.InstancedMesh>(null);
  const { camera } = useThree();
  const weather = useSimulationStore((state) => state.weather);
  const wind = WEATHER_WIND[weather];

  // Mutable drop state lives in a ref so it is only ever touched inside
  // useFrame (refs are the sanctioned mutable container — the React purity
  // lint forbids mutating render-scope values). Initialized lazily on the
  // first frame so Math.random stays out of render; the seeded PRNG gives a
  // stable, reproducible field.
  const drops = useRef<DropField | null>(null);

  useFrame((_, delta) => {
    const instanced = mesh.current;
    const anchor = group.current;
    if (!instanced || !anchor) return;

    if (!drops.current) {
      const rand = mulberry32(0x5eed1a1e);
      const position = new Float32Array(config.count * 3);
      const speed = new Float32Array(config.count);
      for (let i = 0; i < config.count; i++) {
        position[i * 3] = (rand() * 2 - 1) * EXTENT_X;
        position[i * 3 + 1] = rand() * RAIN_MAX_Y;
        position[i * 3 + 2] = (rand() * 2 - 1) * EXTENT_Z;
        speed[i] = 0.7 + rand() * 0.6;
      }
      drops.current = { position, speed, dummy: new THREE.Object3D() };
      instanced.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    }

    const { position, speed, dummy } = drops.current;
    const dt = Math.min(delta, 0.05);
    const slant = wind * config.windScale;
    const fall = config.fall;
    for (let i = 0; i < config.count; i++) {
      const x = position[i * 3] + slant * dt;
      const y = position[i * 3 + 1] - fall * speed[i] * dt;
      const z = position[i * 3 + 2];
      if (y < 0) {
        position[i * 3] = (Math.random() * 2 - 1) * EXTENT_X;
        position[i * 3 + 2] = (Math.random() * 2 - 1) * EXTENT_Z;
        position[i * 3 + 1] = RAIN_MAX_Y;
      } else {
        position[i * 3] = x;
        position[i * 3 + 1] = y;
        position[i * 3 + 2] = z;
      }
      dummy.position.set(position[i * 3], position[i * 3 + 1], position[i * 3 + 2]);
      dummy.updateMatrix();
      instanced.setMatrixAt(i, dummy.matrix);
    }
    instanced.instanceMatrix.needsUpdate = true;
    anchor.position.x = camera.position.x;
    anchor.position.z = camera.position.z;
  });

  return (
    <group ref={group}>
      <instancedMesh ref={mesh} args={[undefined, undefined, config.count]} frustumCulled={false}>
        <boxGeometry args={[config.width, config.length, config.width]} />
        <meshBasicMaterial
          color={config.color}
          transparent
          opacity={config.opacity}
          depthWrite={false}
          fog
        />
      </instancedMesh>
    </group>
  );
}

interface SnowFlake {
  position: Float32Array;
  speed: Float32Array;
  phase: Float32Array;
  scale: Float32Array;
  spin: Float32Array;
  dummy: THREE.Object3D;
}

function SnowFall() {
  const group = useRef<THREE.Group>(null);
  const mesh = useRef<THREE.InstancedMesh>(null);
  const { camera } = useThree();
  const weather = useSimulationStore((state) => state.weather);
  const wind = WEATHER_WIND[weather];

  // One soft round sprite shared by every flake; a plane scaled per flake
  // makes the field look like real falling snow instead of tiny hard spheres.
  const texture = useMemo(() => makeSoftParticleTexture(), []);
  const material = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: texture,
        color: "#ffffff",
        transparent: true,
        opacity: 0.92,
        depthWrite: false,
        // DoubleSide so flakes stay visible from every orbit angle.
        side: THREE.DoubleSide,
        fog: true,
      }),
    [texture],
  );

  useEffect(() => () => material.dispose(), [material]);

  const flakes = useRef<SnowFlake | null>(null);

  useFrame((frame, delta) => {
    const instanced = mesh.current;
    const anchor = group.current;
    if (!instanced || !anchor) return;

    if (!flakes.current) {
      const rand = mulberry32(0x5e3f0a1b);
      const count = 480;
      const position = new Float32Array(count * 3);
      const phase = new Float32Array(count);
      const speed = new Float32Array(count);
      const scale = new Float32Array(count);
      const spin = new Float32Array(count);
      for (let i = 0; i < count; i++) {
        position[i * 3] = (rand() * 2 - 1) * EXTENT_X;
        position[i * 3 + 1] = rand() * SNOW_MAX_Y;
        position[i * 3 + 2] = (rand() * 2 - 1) * EXTENT_Z;
        phase[i] = rand() * Math.PI * 2;
        speed[i] = 0.6 + rand() * 0.8;
        scale[i] = 0.4 + rand() * 0.8;
        spin[i] = (rand() * 2 - 1) * 0.6;
      }
      flakes.current = { position, speed, phase, scale, spin, dummy: new THREE.Object3D() };
      instanced.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    }

    const { position, speed, phase, scale, spin, dummy } = flakes.current;
    const dt = Math.min(delta, 0.05);
    const t = frame.clock.elapsedTime;
    // Gusty cross-drift along the wind plus the classic gentle sway.
    const drift = wind * 1.2;
    for (let i = 0; i < position.length / 3; i++) {
      const x = position[i * 3] + (drift + Math.sin(t * 0.6 + phase[i]) * 1.6) * dt;
      const z = position[i * 3 + 2] + Math.cos(t * 0.5 + phase[i]) * 1.6 * dt;
      const y = position[i * 3 + 1] - SNOW_SPEED * speed[i] * dt;
      if (y < 0) {
        position[i * 3] = (Math.random() * 2 - 1) * EXTENT_X;
        position[i * 3 + 2] = (Math.random() * 2 - 1) * EXTENT_Z;
        position[i * 3 + 1] = SNOW_MAX_Y;
      } else {
        position[i * 3] = x;
        position[i * 3 + 1] = y;
        position[i * 3 + 2] = z;
      }
      dummy.position.set(position[i * 3], position[i * 3 + 1], position[i * 3 + 2]);
      dummy.rotation.set(0, 0, t * spin[i]);
      dummy.scale.set(scale[i], scale[i], 1);
      dummy.updateMatrix();
      instanced.setMatrixAt(i, dummy.matrix);
    }
    instanced.instanceMatrix.needsUpdate = true;
    anchor.position.x = camera.position.x;
    anchor.position.z = camera.position.z;
  });

  return (
    <group ref={group}>
      <instancedMesh ref={mesh} args={[undefined, undefined, 480]} frustumCulled={false}>
        <planeGeometry args={[1, 1]} />
        <primitive object={material} attach="material" />
      </instancedMesh>
    </group>
  );
}
