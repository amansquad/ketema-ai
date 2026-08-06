"use client";

import { useCallback, useState } from "react";
import type { Mesh } from "three";
import { useShallow } from "zustand/react/shallow";

import { SelectionGizmo } from "@/features/editor/components/Gizmos/SelectionGizmo";
import { Ground } from "@/features/editor/components/Scene/Ground";
import { SceneGrid } from "@/features/editor/components/Scene/SceneGrid";
import { SceneObjectMesh } from "@/features/editor/components/Scene/SceneObjectMesh";
import { selectSceneObjects, useEditorStore } from "@/features/editor/store/useEditorStore";

export function SceneContent() {
  const objects = useEditorStore(useShallow(selectSceneObjects));
  const selectedIds = useEditorStore((state) => state.selectedIds);

  // Mesh instances are registered here (via a stable ref callback on each
  // SceneObjectMesh) so the gizmo can look one up by id without ever reading
  // a ref during render.
  const [meshRegistry, setMeshRegistry] = useState<Map<string, Mesh>>(() => new Map());

  const handleSelectRef = useCallback((id: string, mesh: Mesh | null) => {
    setMeshRegistry((prev) => {
      const next = new Map(prev);
      if (mesh) next.set(id, mesh);
      else next.delete(id);
      return next;
    });
  }, []);

  const singleSelectedId = selectedIds.length === 1 ? selectedIds[0] : null;
  const gizmoTarget = singleSelectedId ? meshRegistry.get(singleSelectedId) : undefined;

  return (
    <>
      <Ground />
      <SceneGrid />
      {objects.map((object) => (
        <SceneObjectMesh
          key={object.id}
          object={object}
          isSelected={selectedIds.includes(object.id)}
          onSelectRef={handleSelectRef}
        />
      ))}
      {gizmoTarget && singleSelectedId && (
        <SelectionGizmo target={gizmoTarget} objectId={singleSelectedId} />
      )}
    </>
  );
}
