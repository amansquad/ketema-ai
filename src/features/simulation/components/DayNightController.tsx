"use client";

import { Sky } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";

import { daylightFactor } from "@/features/simulation/engine/metrics";
import { useSimulationStore, type WeatherKind } from "@/features/simulation/store/useSimulationStore";

const WEATHER_FOG_COLOR: Record<WeatherKind, string> = {
  clear: "#87ceeb",
  cloudy: "#9aa5ad",
  rain: "#5c6670",
};
const WEATHER_FOG_FAR: Record<WeatherKind, number> = { clear: 900, cloudy: 500, rain: 260 };
const WEATHER_TURBIDITY: Record<WeatherKind, number> = { clear: 4, cloudy: 8, rain: 14 };

// Mounted inside <Canvas>. Owns the simulation clock (advances hour24 each
// frame while running) and derives sky/sun/fog/lighting from time-of-day and
// weather — this is what makes the "day/night cycle" and "weather system"
// requirements visible rather than just numbers in a store.
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
  const lightIntensity = sunIsUp ? 0.15 + daylight * 1.6 : 0.08;
  const ambientIntensity = 0.15 + daylight * 0.45;
  const lightColor = daylight > 0.6 ? "#fff6e8" : daylight > 0.15 ? "#ffb46b" : "#3a4a7a";

  const fogColor = WEATHER_FOG_COLOR[weather];
  const fogFar = Math.max(120, WEATHER_FOG_FAR[weather] * (0.4 + daylight * 0.6));

  return (
    <>
      <Sky sunPosition={sunPosition} turbidity={WEATHER_TURBIDITY[weather]} rayleigh={weather === "clear" ? 1 : 3} />
      <fog attach="fog" args={[fogColor, 60, fogFar]} />
      <ambientLight intensity={ambientIntensity} />
      <directionalLight
        position={sunPosition}
        intensity={lightIntensity}
        color={lightColor}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-150}
        shadow-camera-right={150}
        shadow-camera-top={150}
        shadow-camera-bottom={-150}
        shadow-camera-far={500}
      />
    </>
  );
}
