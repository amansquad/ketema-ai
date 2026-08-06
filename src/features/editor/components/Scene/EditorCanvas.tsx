"use client";

import { OrbitControls, PerspectiveCamera, Stats } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense, useState } from "react";

import { CanvasErrorBoundary, CanvasFallback } from "@/features/editor/components/Scene/CanvasErrorBoundary";
import { SceneContent } from "@/features/editor/components/Scene/SceneContent";
import { ViewportRegistrar } from "@/features/editor/components/Scene/ViewportRegistrar";
import { hasWebGLSupport } from "@/features/editor/lib/webgl";
import { DayNightController } from "@/features/simulation/components/DayNightController";
import { PedestrianSimulation } from "@/features/simulation/components/PedestrianSimulation";
import { PollutionHeatmap } from "@/features/simulation/components/PollutionHeatmap";
import { TrafficSimulation } from "@/features/simulation/components/TrafficSimulation";

export function EditorCanvas() {
  // Lazy state initializer runs once, client-side only (SSR always renders
  // the true branch — see hasWebGLSupport — then this reconciles on mount).
  const [webglSupported] = useState(hasWebGLSupport);

  if (!webglSupported) {
    return <CanvasFallback message="WebGL isn't available in this browser." />;
  }

  return (
    <CanvasErrorBoundary>
      <Canvas
        shadows
        dpr={[1, 1.5]}
        gl={{ powerPreference: "high-performance", antialias: true }}
        className="touch-none"
      >
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
    </CanvasErrorBoundary>
  );
}
