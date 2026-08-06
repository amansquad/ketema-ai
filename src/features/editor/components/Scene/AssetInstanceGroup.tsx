"use client";

import { Instance, Instances } from "@react-three/drei";
import { useCallback } from "react";
import type { Object3D } from "three";

import { ASSET_DEFAULTS } from "@/features/editor/lib/createSceneObject";
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

const SELECTED_COLOR = "#ffb020";

interface AssetInstanceGroupProps {
  assetKind: AssetKind;
  objects: SceneObject[];
  selectedIds: string[];
  onSelectRef: (id: string, node: Object3D | null) => void;
  onSelect: (id: string, additive: boolean) => void;
}

// All objects of one AssetKind share a single InstancedMesh (one draw call
// regardless of count) via drei's Instances/Instance. The trade-off: every
// instance in a group shares one roughness/metalness — only per-instance
// *color* varies (used here for the selection highlight). If a future
// milestone adds per-object material editing beyond color, instances whose
// material diverges from the catalog default will need to fall back to
// individual meshes.
export function AssetInstanceGroup({
  assetKind,
  objects,
  selectedIds,
  onSelectRef,
  onSelect,
}: AssetInstanceGroupProps) {
  if (objects.length === 0) return null;

  const isCylindrical = CYLINDRICAL_ASSETS.has(assetKind);
  const isFlat = FLAT_ASSETS.has(assetKind);
  const defaults = ASSET_DEFAULTS[assetKind];

  return (
    <Instances limit={objects.length} range={objects.length} castShadow={!isFlat} receiveShadow>
      {isCylindrical ? <cylinderGeometry args={[0.5, 0.5, 1, 16]} /> : <boxGeometry args={[1, 1, 1]} />}
      <meshStandardMaterial roughness={defaults.roughness} metalness={defaults.metalness} />
      {objects.map((object) => (
        <InstanceItem
          key={object.id}
          object={object}
          isSelected={selectedIds.includes(object.id)}
          onSelectRef={onSelectRef}
          onSelect={onSelect}
        />
      ))}
    </Instances>
  );
}

interface InstanceItemProps {
  object: SceneObject;
  isSelected: boolean;
  onSelectRef: (id: string, node: Object3D | null) => void;
  onSelect: (id: string, additive: boolean) => void;
}

// A dedicated component (rather than an inline ref in the .map() above) so
// the ref callback can be memoized with useCallback. An inline ref callback
// gets a new identity every render, and React detaches+reattaches refs
// whenever their identity changes — which, since onSelectRef ultimately
// calls a setState in the parent, was creating an infinite
// render -> new ref -> setState -> render loop (React error #185,
// "Maximum update depth exceeded") that crashed the WebGL context.
function InstanceItem({ object, isSelected, onSelectRef, onSelect }: InstanceItemProps) {
  const setRef = useCallback(
    (node: Object3D | null) => {
      onSelectRef(object.id, node);
    },
    [object.id, onSelectRef],
  );

  return (
    <Instance
      ref={setRef}
      position={object.position}
      rotation={object.rotation}
      scale={object.scale}
      color={isSelected ? SELECTED_COLOR : object.material.color}
      onPointerDown={(event) => {
        if (event.button !== 0) return;
        event.stopPropagation();
        onSelect(object.id, event.shiftKey);
      }}
    />
  );
}
