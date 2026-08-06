"use client";

import { Environment, OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";

import { AssetInstanceGroup } from "@/features/editor/components/Scene/AssetInstanceGroup";
import { Ground } from "@/features/editor/components/Scene/Ground";
import { SceneGrid } from "@/features/editor/components/Scene/SceneGrid";
import type { AssetKind, SceneObject } from "@/features/editor/types";

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

// A view-only render of a shared scene: same instanced-mesh rendering as the
// editor, but no selection, gizmo, drag-and-drop, or store — just a camera
// the visitor can orbit around.
export function ReadOnlyCanvas({ objects }: { objects: SceneObject[] }) {
  const groups = groupByAssetKind(objects);

  return (
    <Canvas shadows dpr={[1, 2]} className="touch-none">
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
      </Suspense>
    </Canvas>
  );
}
