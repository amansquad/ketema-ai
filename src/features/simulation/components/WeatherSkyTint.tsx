"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

import { daylightFactor } from "@/features/simulation/engine/metrics";
import { WEATHER_SKY_TINT } from "@/features/simulation/lib/weatherVisuals";
import { useSimulationStore } from "@/features/simulation/store/useSimulationStore";

const DOME_RADIUS = 1400;
const NIGHT_SKY_COLOR = new THREE.Color("#2b3966");
const DOME_WHITE = new THREE.Color("#ffffff");
const DOME_COLOR = new THREE.Color();

function hexToRgb(hex: string): [number, number, number] {
  const value = parseInt(hex.slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function mixHex(a: string, b: string, t: number): string {
  const [ar, ag, ab] = hexToRgb(a);
  const [br, bg, bb] = hexToRgb(b);
  const mix = (x: number, y: number) => Math.round(x + (y - x) * t);
  return `rgb(${mix(ar, br)}, ${mix(ag, bg)}, ${mix(ab, bb)})`;
}

// Vertical gradient for the sky dome: deep color at the zenith, a lighter band
// near the horizon (where light scatters through the thickest air), then the
// warm event color at the rim.
function makeSkyTintTexture(top: string, bottom: string): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const gradient = ctx.createLinearGradient(0, 0, 0, size);
  gradient.addColorStop(0, top);
  gradient.addColorStop(0.55, mixHex(top, bottom, 0.45));
  gradient.addColorStop(1, bottom);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Full-sky color override for weathers the physical drei sky shader can't
 * reproduce — the flat gray lid of an overcast day, the brown wall of a dust
 * storm, the slate of a storm front. A translucent gradient dome (BackSide)
 * sits between the camera and the atmospheric sky, centered on the camera so
 * the horizon stays level as you orbit. Opacity 0 → no dome at all. At night
 * the dome is tinted toward the shared night-sky blue so a gray overcast lid
 * doesn't glow in the dark.
 */
export function WeatherSkyTint() {
  const weather = useSimulationStore((state) => state.weather);
  const config = WEATHER_SKY_TINT[weather];

  const mesh = useRef<THREE.Mesh>(null);
  const { camera } = useThree();

  const texture = useMemo(
    () => (config ? makeSkyTintTexture(config.top, config.bottom) : null),
    [config],
  );
  const material = useMemo(() => {
    if (!config || !texture) return null;
    return new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: config.opacity,
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
    });
  }, [config, texture]);

  useEffect(() => {
    return () => {
      material?.dispose();
      texture?.dispose();
    };
  }, [material, texture]);

  useFrame(() => {
    // Keep the horizon centered on the viewer; only X/Z follow so the dome
    // never dips below the ground plane.
    if (mesh.current) {
      mesh.current.position.set(camera.position.x, 0, camera.position.z);
    }
    if (material) {
      // Darken the whole dome toward night blue as the sun goes down.
      const daylight = daylightFactor(useSimulationStore.getState().hour24);
      const night = Math.min(1, Math.max(0, (0.65 - daylight) / 0.6));
      DOME_COLOR.copy(DOME_WHITE).lerp(NIGHT_SKY_COLOR, night);
      material.color.copy(DOME_COLOR);
    }
  });

  if (!config || !material) return null;

  return (
    <mesh ref={mesh} material={material} frustumCulled={false} renderOrder={-1}>
      <sphereGeometry args={[DOME_RADIUS, 32, 16]} />
    </mesh>
  );
}
