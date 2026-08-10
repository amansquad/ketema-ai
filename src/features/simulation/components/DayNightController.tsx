"use client";

import { Sky, Sparkles } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { daylightFactor } from "@/features/simulation/engine/metrics";
import { LightningFlash } from "@/features/simulation/components/LightningFlash";
import { MistLayer } from "@/features/simulation/components/MistLayer";
import { Precipitation } from "@/features/simulation/components/Precipitation";
import { CloudLayer } from "@/features/simulation/components/CloudLayer";
import { WeatherSkyTint } from "@/features/simulation/components/WeatherSkyTint";
import { WindDust } from "@/features/simulation/components/WindDust";
import {
  WEATHER_AMBIENT,
  WEATHER_DAY_COLOR,
  WEATHER_FOG_COLOR,
  WEATHER_FOG_FAR,
  WEATHER_HAS_HAZE_DUST,
  WEATHER_MIE,
  WEATHER_RAYLEIGH,
  WEATHER_TURBIDITY,
  WEATHER_SUN,
} from "@/features/simulation/lib/weatherVisuals";
import { useSimulationStore } from "@/features/simulation/store/useSimulationStore";

const NIGHT_SKY_COLOR = new THREE.Color("#2b3966");
const DAY_COLOR = new THREE.Color();
const LIGHT_COLOR = new THREE.Color();

// Mounted inside <Canvas>. Owns the simulation clock (advances hour24 each
// frame while running) and derives sky/sun/fog/lighting from time-of-day and
// weather — this is what makes the "day/night cycle" and "weather system"
// requirements visible rather than just numbers in a store. All the per-weather
// tuning lives in weatherVisuals.ts; this component only turns that table into
// three.js nodes plus the FX layers (clouds, precipitation, lightning, mist,
// wind-blown dust, and the tint dome for dramatic skies).
export function DayNightController() {
  useFrame((_, delta) => {
    const { running, speedHoursPerSecond, advanceHour } = useSimulationStore.getState();
    if (running) advanceHour(delta * speedHoursPerSecond);
  });

  const hour24 = useSimulationStore((state) => state.hour24);
  const weather = useSimulationStore((state) => state.weather);

  const daylight = daylightFactor(hour24);
  const angle = ((hour24 - 6) / 24) * Math.PI * 2;
  const sunDistance = 400;
  const sunPosition: [number, number, number] = [
    Math.cos(angle) * sunDistance,
    Math.sin(angle) * sunDistance,
    150,
  ];

  const sunIsUp = sunPosition[1] > -20;
  const sun = WEATHER_SUN[weather];
  const ambient = WEATHER_AMBIENT[weather];
  const lightIntensity = sunIsUp ? sun.base + daylight * sun.day : sun.base * 0.5;
  const ambientIntensity = ambient.base + daylight * ambient.day;

  // Day/night color: cold blue at night, the weather's midday tint by day.
  // Lerped into module-level colors to avoid per-frame allocations.
  DAY_COLOR.set(WEATHER_DAY_COLOR[weather]);
  LIGHT_COLOR.copy(NIGHT_SKY_COLOR).lerp(
    DAY_COLOR,
    Math.min(1, Math.max(0, (daylight - 0.05) / 0.6)),
  );

  const fogColor = WEATHER_FOG_COLOR[weather];
  const fogFar = Math.max(80, WEATHER_FOG_FAR[weather] * (0.4 + daylight * 0.6));
  const mie = WEATHER_MIE[weather];

  return (
    <>
      <Sky
        sunPosition={sunPosition}
        turbidity={WEATHER_TURBIDITY[weather]}
        rayleigh={WEATHER_RAYLEIGH[weather]}
        mieCoefficient={mie.coefficient}
        mieDirectionalG={mie.directionalG}
      />
      {/* A translucent gradient dome that overrides the sky color for weathers
          the atmospheric shader can't render (overcast lid, dust wall, storm
          front). Renders behind everything (negative renderOrder). */}
      <WeatherSkyTint />
      <fog attach="fog" args={[fogColor, 60, fogFar]} />
      <ambientLight intensity={ambientIntensity} />
      {/* Shadow settings: bias + normalBias stop acne speckling; the radius
          softens the PCF filter so shadow edges don't crawl in texel-sized
          steps while objects move (three.js deprecated PCFSoftShadowMap, so
          without this the shadows are hard-edged and the ground shimmers
          around a dragged object). */}
      <directionalLight
        position={sunPosition}
        intensity={lightIntensity}
        color={LIGHT_COLOR}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0005}
        shadow-normalBias={0.5}
        shadow-radius={2}
        shadow-camera-left={-150}
        shadow-camera-right={150}
        shadow-camera-top={150}
        shadow-camera-bottom={-150}
        shadow-camera-far={500}
      />
      {/* Weather FX layers — each reads the same WEATHER_* tables. */}
      <CloudLayer />
      <Precipitation />
      <LightningFlash />
      <MistLayer />
      <WindDust />
      {/* Suspended dust for dry, hazy highland days (Ethiopia's dry season). */}
      {WEATHER_HAS_HAZE_DUST[weather] && (
        <Sparkles
          count={130}
          scale={[380, 60, 380]}
          position={[0, 28, 0]}
          size={3}
          speed={0.25}
          opacity={0.4}
          color="#d8b98a"
        />
      )}
    </>
  );
}
