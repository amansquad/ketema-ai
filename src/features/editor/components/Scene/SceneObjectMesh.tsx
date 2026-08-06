"use client";

import { useCallback, useRef } from "react";
import type { Mesh } from "three";

import { useEditorStore } from "@/features/editor/store/useEditorStore";
import type { AssetKind, SceneObject } from "@/features/editor/types";

const CYLINDRICAL_ASSETS = new Set<AssetKind>([
  "tree",
  "wind-turbine",
  "street-light",
  "traffic-light",
  "water-tank",
  "monument",
]);

const FLAT_ASSETS = new Set<AssetKind>(["road", "park", "river", "solar-panel"]);

interface SceneObjectMeshProps {
  object: SceneObject;
  isSelected: boolean;
  onSelectRef?: (id: string, mesh: Mesh | null) => void;
}

export function SceneObjectMesh({ object, isSelected, onSelectRef }: SceneObjectMeshProps) {
  const meshRef = useRef<Mesh>(null);
  const select = useEditorStore((state) => state.select);

  const isCylindrical = CYLINDRICAL_ASSETS.has(object.assetKind);
  const isFlat = FLAT_ASSETS.has(object.assetKind);

  const setRefs = useCallback(
    (mesh: Mesh | null) => {
      meshRef.current = mesh;
      onSelectRef?.(object.id, mesh);
    },
    [object.id, onSelectRef],
  );

  return (
    <mesh
      ref={setRefs}
      position={object.position}
      rotation={object.rotation}
      scale={object.scale}
      castShadow={!isFlat}
      receiveShadow
      userData={{ objectId: object.id }}
      onPointerDown={(event) => {
        if (event.button !== 0) return;
        event.stopPropagation();
        select(object.id, { additive: event.shiftKey });
      }}
    >
      {isCylindrical ? (
        <cylinderGeometry args={[0.5, 0.5, 1, 16]} />
      ) : (
        <boxGeometry args={[1, 1, 1]} />
      )}
      <meshStandardMaterial
        color={isSelected ? "#ffb020" : object.material.color}
        roughness={object.material.roughness}
        metalness={object.material.metalness}
        emissive={isSelected ? "#ffb020" : "#000000"}
        emissiveIntensity={isSelected ? 0.25 : 0}
      />
    </mesh>
  );
}
