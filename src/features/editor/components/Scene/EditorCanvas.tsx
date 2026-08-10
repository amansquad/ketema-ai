"use client";

import { OrbitControls, PerspectiveCamera, Stats } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Bloom, EffectComposer, N8AO, Vignette } from "@react-three/postprocessing";
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
        <PerspectiveCamera makeDefault position={[30, 26, 30]} fov={50} near={1} far={3000} />
        <OrbitControls makeDefault enableDamping dampingFactor={0.08} minDistance={4} maxDistance={800} />

        <DayNightController />
        {process.env.NODE_ENV === "development" && <Stats className="!left-auto !right-0" />}

        <Suspense fallback={null}>
          <SceneContent />
          <TrafficSimulation />
          <PedestrianSimulation />
          <PollutionHeatmap />
        </Suspense>

        {/* Post-processing is purely a render pass over the composed frame — it
            never intercepts pointer events, so the instanced-mesh selection
            raycasting and gizmo dragging above are unaffected. Kept
            conservative for a real-time editor: N8AO's "performance" quality
            is the cheapest tier (this is what buys back most of the "flat"
            look, by darkening creases between buildings/props that direct
            light alone can't shade), Bloom only catches genuinely bright
            pixels (sun, lit windows, water highlights) rather than blooming
            the whole scene, and Vignette is subtle enough to add depth
            without reading as a filter.
            screenSpaceRadius keeps the AO radius in screen space rather than
            world space — without it, a world-space radius of 2 units reads as
            enormous against the 2000-unit ground plane at a distance, and the
            per-pixel AO sample pattern dithers/shimmers as the camera moves
            ("the ground keeps shaking"). halfRes trades a little AO softness
            for meaningfully better frame time while orbiting/dragging. */}
        <EffectComposer multisampling={0}>
          <N8AO
            aoRadius={1}
            distanceFalloff={1}
            intensity={1.5}
            quality="performance"
            screenSpaceRadius
            halfRes
          />
          <Bloom
            luminanceThreshold={0.85}
            luminanceSmoothing={0.2}
            intensity={0.4}
            mipmapBlur
          />
          <Vignette eskil={false} offset={0.15} darkness={0.5} />
        </EffectComposer>
      </Canvas>
    </CanvasErrorBoundary>
  );
}
