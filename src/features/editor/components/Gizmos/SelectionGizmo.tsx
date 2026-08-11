"use client";

import { TransformControls } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import type { Object3D } from "three";

import {
  getAssetParts,
  getPrimaryPart,
  invertComposeRotations,
  multiplyVectors,
  rotateAroundY,
} from "@/features/editor/lib/assetVisuals";
import { getPartVariation, unapplyVariation } from "@/features/editor/lib/objectVariation";
import { useEditorStore } from "@/features/editor/store/useEditorStore";
import type { Vector3Tuple } from "@/features/editor/types";

interface OrbitLikeControls {
  enabled: boolean;
}

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

  // Explicitly disabling the default OrbitControls instance for the
  // duration of a gizmo drag — rather than relying on TransformControls to
  // cooperate with it implicitly — is the standard, documented R3F pattern;
  // without it, a drag on the gizmo can simultaneously orbit the camera
  // (both respond to the same left-mouse-drag), leaving the camera pointed
  // somewhere nonsensical once you let go. `state.get` is R3F's imperative,
  // non-reactive store accessor — using it (rather than the reactive
  // `useThree` selector) is what makes mutating `.enabled` here legitimate.
  const getThreeState = useThree((state) => state.get);
  function setOrbitControlsEnabled(enabled: boolean) {
    const controls = getThreeState().controls as unknown as OrbitLikeControls | null;
    if (controls) controls.enabled = enabled;
  }

  return (
    <TransformControls
      object={target}
      mode={transformMode}
      makeDefault={true}
      onMouseDown={() => setOrbitControlsEnabled(false)}
      onMouseUp={() => {
        setOrbitControlsEnabled(true);
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

        // The primary part may carry a deterministic per-object variation
        // (e.g. tree foliage size/tilt jitter) in addition to the part's own
        // fixed transform — undo both so the stored object transform never
        // accumulates them.
        const variation = getPartVariation(objectId, primaryPart);
        const scaleMul = variation?.scaleMul ?? 1;

        // Fix: when scaling, we must account for the part's own local scale.
        // target.scale is the current WORLD scale of the instance.
        // object.scale = worldScale / partLocalScale / variationScale
        const scale: Vector3Tuple = [
          target.scale.x / (primaryPart.scale[0] * scaleMul),
          target.scale.y / (primaryPart.scale[1] * scaleMul),
          target.scale.z / (primaryPart.scale[2] * scaleMul),
        ];
        // The primary part's fixed tilt is applied *before* the object's own
        // rotation (see composeRotations), so invert it to recover the object's
        // true rotation; parts without a rotation pass straight through.
        const recoveredRotation = invertComposeRotations(
          [target.rotation.x, target.rotation.y, target.rotation.z],
          primaryPart.rotation,
        );
        const rotation: Vector3Tuple = variation ? unapplyVariation(recoveredRotation, variation) : recoveredRotation;
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
