"use client";

import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense, useState } from "react";

import { AssetInstanceGroup } from "@/features/editor/components/Scene/AssetInstanceGroup";
import { CanvasErrorBoundary, CanvasFallback } from "@/features/editor/components/Scene/CanvasErrorBoundary";
import { Ground } from "@/features/editor/components/Scene/Ground";
import { SceneGrid } from "@/features/editor/components/Scene/SceneGrid";
import type { AssetKind, SceneObject } from "@/features/editor/types";
import { hasWebGLSupport } from "@/features/editor/lib/webgl";
import { DayNightController } from "@/features/simulation/components/DayNightController";
import { PedestrianSimulation } from "@/features/simulation/components/PedestrianSimulation";
import { TrafficSimulation } from "@/features/simulation/components/TrafficSimulation";

function groupByAssetKind(objects: SceneObject[]): Map<AssetKind, SceneObject[]> {
  const groups = new Map<AssetKind, SceneObject[]>();
  for (const object of objects) {
    const list = groups.get(object.assetKind) ?? [];
    list.push(object);
    groups.set(object.assetKind, list);
  }
  return groups;
}

const noop = () => {};

// A view-only render of a shared scene: same instanced-mesh rendering, day/
// night cycle, and traffic/pedestrian simulation as the editor, but no
// selection, gizmo, drag-and-drop, or store writes — just a camera the
// visitor can orbit around. Uses the same shared editor/simulation Zustand
// stores as the editor; a visitor's browser never had them populated with
// anything but this scene, so read-only holds even though nothing enforces
// it structurally.
export function ReadOnlyCanvas({ objects }: { objects: SceneObject[] }) {
  const groups = groupByAssetKind(objects);
  const [webglSupported] = useState(hasWebGLSupport);

  if (!webglSupported) {
    return <CanvasFallback message="WebGL isn't available in this browser." />;
  }

  return (
    <CanvasErrorBoundary>
      <Canvas shadows dpr={[1, 1.5]} gl={{ powerPreference: "high-performance", antialias: true }} className="touch-none">
        <PerspectiveCamera makeDefault position={[30, 26, 30]} fov={50} near={1} far={3000} />
        <OrbitControls makeDefault enableDamping dampingFactor={0.08} minDistance={4} maxDistance={800} />

        <DayNightController />

        <Suspense fallback={null}>
          <Ground />
          <SceneGrid />
          {Array.from(groups.entries()).map(([assetKind, groupObjects]) => (
            <AssetInstanceGroup
              key={assetKind}
              assetKind={assetKind}
              objects={groupObjects}
              selectedIds={[]}
              onSelectRef={noop}
              onSelect={noop}
            />
          ))}
          <TrafficSimulation objects={objects} />
          <PedestrianSimulation objects={objects} />
        </Suspense>
      </Canvas>
    </CanvasErrorBoundary>
  );
}
