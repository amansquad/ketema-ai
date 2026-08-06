"use client";

import { OrbitControls, PerspectiveCamera, Stats } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";

import { SceneContent } from "@/features/editor/components/Scene/SceneContent";
import { ViewportRegistrar } from "@/features/editor/components/Scene/ViewportRegistrar";
import { DayNightController } from "@/features/simulation/components/DayNightController";
import { PedestrianSimulation } from "@/features/simulation/components/PedestrianSimulation";
import { PollutionHeatmap } from "@/features/simulation/components/PollutionHeatmap";
import { TrafficSimulation } from "@/features/simulation/components/TrafficSimulation";

export function EditorCanvas() {
  return (
    <Canvas shadows dpr={[1, 2]} className="touch-none">
      <ViewportRegistrar />
      <PerspectiveCamera makeDefault position={[30, 26, 30]} fov={50} near={0.1} far={4000} />
      <OrbitControls makeDefault enableDamping dampingFactor={0.08} minDistance={4} maxDistance={800} />

      <DayNightController />
      {process.env.NODE_ENV === "development" && <Stats className="!left-auto !right-0" />}

      <Suspense fallback={null}>
        <SceneContent />
        <TrafficSimulation />
        <PedestrianSimulation />
        <PollutionHeatmap />
      </Suspense>
    </Canvas>
  );
}
