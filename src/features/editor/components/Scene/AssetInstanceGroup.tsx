"use client";

import { Instance, Instances } from "@react-three/drei";
import { useCallback, useMemo } from "react";
import type { Object3D } from "three";import { makeNoiseTexture } from "@/features/editor/lib/proceduralTexture";
import { getPartVariation } from "@/features/editor/lib/objectVariation";
import { ASSET_DEFAULTS } from "@/features/editor/lib/createSceneObject";

// Part definitions are module-level constants, so a WeakMap keyed by the part
// object caches each generated texture across group mounts/remounts instead of
// redrawing the 256×256 canvas every time.
const partTextureCache = new WeakMap<AssetPart, ReturnType<typeof makeNoiseTexture>>();

function getPartTexture(part: AssetPart) {
  if (!part.texture) return null;
  const cached = partTextureCache.get(part);
  if (cached) return cached;
  const texture = makeNoiseTexture(part.texture);
  partTextureCache.set(part, texture);
  return texture;
}
import {
  composeRotations,
  getAssetParts,
  getPrimaryPart,
  multiplyVectors,
  rotateAroundY,
  type AssetPart,
} from "@/features/editor/lib/assetVisuals";
import type { AssetKind, SceneObject, Vector3Tuple } from "@/features/editor/types";

// Assets that lie flat on the ground (so casting a shadow would just paint a
// dark smear beside them) — solar panels are deliberately excluded now that
// they're rendered as tilted panels.
const FLAT_ASSETS = new Set<AssetKind>(["road", "park", "river", "lake"]);

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
  // Parts may carry a procedural noise texture (e.g. rocky mountain cliffs).
  const map = useMemo(() => getPartTexture(part), [part]);

  return (
    <Instances limit={objects.length} range={objects.length} castShadow={castShadow} receiveShadow>
      {part.geometry === "cylinder" && <cylinderGeometry args={part.args} />}
      {part.geometry === "cone" && <coneGeometry args={part.args} />}
      {part.geometry === "sphere" && <sphereGeometry args={part.args} />}
      {part.geometry === "box" && <boxGeometry args={part.args} />}
      {/* Negative polygonOffset pushes part geometry slightly toward the camera in
          the depth buffer, so faces resting exactly on the ground plane (building
          bases, roads, parks) never z-fight with the ground — whose own positive
          offset pushes it back. On the textured ground that flicker is visible as
          the "shaking" around newly placed objects. */}
      <meshStandardMaterial
        roughness={roughness}
        metalness={metalness}
        map={map ?? undefined}
        polygonOffset
        polygonOffsetFactor={-1}
        polygonOffsetUnits={-1}
      />
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

  // Parts marked `varied` (tree foliage) get a deterministic per-object size
  // and tilt jitter so a forest doesn't look uniform. Deterministic from the
  // object id, so it's stable across renders — and the gizmo un-applies it.
  const variation = getPartVariation(object.id, part);

  const localOffset = multiplyVectors(object.scale, part.offset);
  const worldOffset = rotateAroundY(localOffset, object.rotation[1]);
  const position: Vector3Tuple = [
    object.position[0] + worldOffset[0],
    object.position[1] + worldOffset[1],
    object.position[2] + worldOffset[2],
  ];
  const scale = multiplyVectors(object.scale, part.scale);
  if (variation) {
    scale[0] *= variation.scaleMul;
    scale[1] *= variation.scaleMul;
    scale[2] *= variation.scaleMul;
  }
  // Keep the zero-allocation fast path in composeRotations for the common
  // case (no part rotation, no variation) by passing undefined.
  let partRotation: Vector3Tuple | undefined = part.rotation ? [...part.rotation] : undefined;
  if (variation) {
    partRotation ??= [0, 0, 0];
    partRotation[0] += variation.tilt;
  }
  const rotation = composeRotations(object.rotation, partRotation);
  const color = isSelected ? SELECTED_COLOR : (part.color ?? object.material.color);

  return (
    <Instance
      ref={setRef}
      position={position}
      rotation={rotation}
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
