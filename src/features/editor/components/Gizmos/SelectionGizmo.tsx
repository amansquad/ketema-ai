"use client";

import { TransformControls } from "@react-three/drei";
import type { Object3D } from "three";

import { getAssetParts, getPrimaryPart, multiplyVectors, rotateAroundY } from "@/features/editor/lib/assetVisuals";
import { useEditorStore } from "@/features/editor/store/useEditorStore";
import type { Vector3Tuple } from "@/features/editor/types";

interface SelectionGizmoProps {
  target: Object3D;
  objectId: string;
}

// Attached only when exactly one object is selected (three.js TransformControls
// operates on a single Object3D — here, the *primary part's* drei `Instance`
// from its asset's instanced mesh group, e.g. a tree's foliage cone rather
// than its trunk). The gizmo manipulates that instance directly for smooth
// per-frame feedback; the store is only written to once, on release, so
// undo/redo gets one history entry per drag instead of one per frame.
export function SelectionGizmo({ target, objectId }: SelectionGizmoProps) {
  const transformMode = useEditorStore((state) => state.transformMode);
  const updateObject = useEditorStore((state) => state.updateObject);
  const assetKind = useEditorStore((state) => state.objects[objectId]?.assetKind);

  return (
    <TransformControls
      object={target}
      mode={transformMode}
      makeDefault={false}
      onMouseUp={() => {
        if (!assetKind) return;

        // The dragged Object3D is the primary *part*, not the object itself
        // — for a single-box building those are the same thing, but for a
        // compound asset (tree, street light, ...) the part is offset from
        // and scaled relative to the object's own transform (see
        // assetVisuals.ts). Invert that fixed relationship to recover the
        // object's true position/rotation/scale from where the part ended
        // up, rather than writing the part's transform straight to the
        // store (which would snap the whole object to the part's offset
        // position and shrink it by the part's scale factor).
        const parts = getAssetParts(assetKind);
        const primaryPart = getPrimaryPart(parts);

        const scale: Vector3Tuple = [
          target.scale.x / primaryPart.scale[0],
          target.scale.y / primaryPart.scale[1],
          target.scale.z / primaryPart.scale[2],
        ];
        const rotation: Vector3Tuple = [target.rotation.x, target.rotation.y, target.rotation.z];
        const worldOffset = rotateAroundY(multiplyVectors(scale, primaryPart.offset), rotation[1]);
        const position: Vector3Tuple = [
          target.position.x - worldOffset[0],
          target.position.y - worldOffset[1],
          target.position.z - worldOffset[2],
        ];

        updateObject(objectId, { position, rotation, scale });
      }}
    />
  );
}
