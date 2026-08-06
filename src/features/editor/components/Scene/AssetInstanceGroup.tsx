"use client";

import { Instance, Instances } from "@react-three/drei";
import { useCallback } from "react";
import type { Object3D } from "three";

import { ASSET_DEFAULTS } from "@/features/editor/lib/createSceneObject";
import {
  getAssetParts,
  getPrimaryPart,
  multiplyVectors,
  rotateAroundY,
  type AssetPart,
} from "@/features/editor/lib/assetVisuals";
import type { AssetKind, SceneObject, Vector3Tuple } from "@/features/editor/types";

const FLAT_ASSETS = new Set<AssetKind>(["road", "park", "river", "solar-panel"]);

const SELECTED_COLOR = "#ffb020";

interface AssetInstanceGroupProps {
  assetKind: AssetKind;
  objects: SceneObject[];
  selectedIds: string[];
  onSelectRef: (id: string, node: Object3D | null) => void;
  onSelect: (id: string, additive: boolean) => void;
}

// Each AssetKind is one or more "parts" (see assetVisuals.ts) — a tree is a
// trunk + foliage, a street light is a pole + lamp, most buildings are still
// a single box. Every part gets its own InstancedMesh shared across all
// objects of that kind (one draw call per part, regardless of how many
// trees/lights/etc. are placed), positioned relative to its parent object's
// transform.
export function AssetInstanceGroup({
  assetKind,
  objects,
  selectedIds,
  onSelectRef,
  onSelect,
}: AssetInstanceGroupProps) {
  if (objects.length === 0) return null;

  const isFlat = FLAT_ASSETS.has(assetKind);
  const parts = getAssetParts(assetKind);
  const primaryPart = getPrimaryPart(parts);
  const defaults = ASSET_DEFAULTS[assetKind];

  return (
    <>
      {parts.map((part) => (
        <PartInstances
          key={part.id}
          part={part}
          objects={objects}
          selectedIds={selectedIds}
          castShadow={!isFlat}
          roughness={defaults.roughness}
          metalness={defaults.metalness}
          onSelectRef={part.id === primaryPart.id ? onSelectRef : undefined}
          onSelect={onSelect}
        />
      ))}
    </>
  );
}

interface PartInstancesProps {
  part: AssetPart;
  objects: SceneObject[];
  selectedIds: string[];
  castShadow: boolean;
  roughness: number;
  metalness: number;
  onSelectRef: ((id: string, node: Object3D | null) => void) | undefined;
  onSelect: (id: string, additive: boolean) => void;
}

function PartInstances({
  part,
  objects,
  selectedIds,
  castShadow,
  roughness,
  metalness,
  onSelectRef,
  onSelect,
}: PartInstancesProps) {
  return (
    <Instances limit={objects.length} range={objects.length} castShadow={castShadow} receiveShadow>
      {part.geometry === "cylinder" && <cylinderGeometry args={part.args} />}
      {part.geometry === "cone" && <coneGeometry args={part.args} />}
      {part.geometry === "sphere" && <sphereGeometry args={part.args} />}
      {part.geometry === "box" && <boxGeometry args={part.args} />}
      <meshStandardMaterial roughness={roughness} metalness={metalness} />
      {objects.map((object) => (
        <PartInstanceItem
          key={object.id}
          object={object}
          part={part}
          isSelected={selectedIds.includes(object.id)}
          onSelectRef={onSelectRef}
          onSelect={onSelect}
        />
      ))}
    </Instances>
  );
}

interface PartInstanceItemProps {
  object: SceneObject;
  part: AssetPart;
  isSelected: boolean;
  onSelectRef: ((id: string, node: Object3D | null) => void) | undefined;
  onSelect: (id: string, additive: boolean) => void;
}

// A dedicated component (rather than an inline ref in a .map()) so the ref
// callback can be memoized with useCallback — an inline ref callback gets a
// new identity every render, and since onSelectRef ultimately calls a
// setState in a parent, that previously created an infinite
// render -> new ref -> setState -> render loop (React error #185).
function PartInstanceItem({ object, part, isSelected, onSelectRef, onSelect }: PartInstanceItemProps) {
  const setRef = useCallback(
    (node: Object3D | null) => {
      onSelectRef?.(object.id, node);
    },
    [object.id, onSelectRef],
  );

  const localOffset = multiplyVectors(object.scale, part.offset);
  const worldOffset = rotateAroundY(localOffset, object.rotation[1]);
  const position: Vector3Tuple = [
    object.position[0] + worldOffset[0],
    object.position[1] + worldOffset[1],
    object.position[2] + worldOffset[2],
  ];
  const scale = multiplyVectors(object.scale, part.scale);
  const color = isSelected ? SELECTED_COLOR : (part.color ?? object.material.color);

  return (
    <Instance
      ref={setRef}
      position={position}
      rotation={object.rotation}
      scale={scale}
      color={color}
      onPointerDown={(event) => {
        if (event.button !== 0) return;
        event.stopPropagation();
        onSelect(object.id, event.shiftKey);
      }}
    />
  );
}
