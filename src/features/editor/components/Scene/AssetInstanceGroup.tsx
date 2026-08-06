"use client";

import { Instance, Instances } from "@react-three/drei";
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
        <Instance
          key={object.id}
          ref={(node: Object3D | null) => onSelectRef(object.id, node)}
          position={object.position}
          rotation={object.rotation}
          scale={object.scale}
          color={selectedIds.includes(object.id) ? SELECTED_COLOR : object.material.color}
          onPointerDown={(event) => {
            if (event.button !== 0) return;
            event.stopPropagation();
            onSelect(object.id, event.shiftKey);
          }}
        />
      ))}
    </Instances>
  );
}
