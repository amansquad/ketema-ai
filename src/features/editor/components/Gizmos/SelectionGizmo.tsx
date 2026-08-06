"use client";

import { TransformControls } from "@react-three/drei";
import type { Object3D } from "three";

import { useEditorStore } from "@/features/editor/store/useEditorStore";

interface SelectionGizmoProps {
  target: Object3D;
  objectId: string;
}

// Attached only when exactly one object is selected (three.js TransformControls
// operates on a single Object3D — here, one drei `Instance` from its asset's
// instanced mesh group). The gizmo manipulates that instance directly for
// smooth per-frame feedback; the store is only written to once, on release,
// so undo/redo gets one history entry per drag instead of one per frame.
export function SelectionGizmo({ target, objectId }: SelectionGizmoProps) {
  const transformMode = useEditorStore((state) => state.transformMode);
  const updateObject = useEditorStore((state) => state.updateObject);

  return (
    <TransformControls
      object={target}
      mode={transformMode}
      makeDefault={false}
      onMouseUp={() => {
        updateObject(objectId, {
          position: [target.position.x, target.position.y, target.position.z],
          rotation: [target.rotation.x, target.rotation.y, target.rotation.z],
          scale: [target.scale.x, target.scale.y, target.scale.z],
        });
      }}
    />
  );
}
