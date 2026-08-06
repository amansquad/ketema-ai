"use client";

import { Environment, OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";

import { SceneContent } from "@/features/editor/components/Scene/SceneContent";
import { ViewportRegistrar } from "@/features/editor/components/Scene/ViewportRegistrar";

export function EditorCanvas() {
  return (
    <Canvas shadows dpr={[1, 2]} className="touch-none">
      <ViewportRegistrar />
      <PerspectiveCamera makeDefault position={[30, 26, 30]} fov={50} near={0.1} far={4000} />
      <OrbitControls makeDefault enableDamping dampingFactor={0.08} minDistance={4} maxDistance={800} />

      <ambientLight intensity={0.5} />
      <directionalLight
        position={[60, 90, 40]}
        intensity={1.6}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-150}
        shadow-camera-right={150}
        shadow-camera-top={150}
        shadow-camera-bottom={-150}
        shadow-camera-far={400}
      />

      <Suspense fallback={null}>
        <Environment preset="city" environmentIntensity={0.35} />
        <SceneContent />
      </Suspense>
    </Canvas>
  );
}
