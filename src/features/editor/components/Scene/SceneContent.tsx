"use client";

import { useCallback, useMemo, useState } from "react";
import type { Object3D } from "three";
import { useShallow } from "zustand/react/shallow";

import { SelectionGizmo } from "@/features/editor/components/Gizmos/SelectionGizmo";
import { AssetInstanceGroup } from "@/features/editor/components/Scene/AssetInstanceGroup";
import { Ground } from "@/features/editor/components/Scene/Ground";
import { SceneGrid } from "@/features/editor/components/Scene/SceneGrid";
import { selectSceneObjects, useEditorStore } from "@/features/editor/store/useEditorStore";
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

export function SceneContent() {
  const objects = useEditorStore(useShallow(selectSceneObjects));
  const selectedIds = useEditorStore((state) => state.selectedIds);
  const select = useEditorStore((state) => state.select);

  // Instances are registered here (via a stable ref callback on each
  // AssetInstanceGroup's Instance) so the gizmo can look one up by id
  // without ever reading a ref during render.
  const [instanceRegistry, setInstanceRegistry] = useState<Map<string, Object3D>>(() => new Map());

  const handleSelectRef = useCallback((id: string, node: Object3D | null) => {
    setInstanceRegistry((prev) => {
      const next = new Map(prev);
      if (node) next.set(id, node);
      else next.delete(id);
      return next;
    });
  }, []);

  const handleSelect = useCallback(
    (id: string, additive: boolean) => select(id, { additive }),
    [select],
  );

  const groups = useMemo(() => groupByAssetKind(objects), [objects]);

  const singleSelectedId = selectedIds.length === 1 ? selectedIds[0] : null;
  const gizmoTarget = singleSelectedId ? instanceRegistry.get(singleSelectedId) : undefined;

  return (
    <>
      <Ground />
      <SceneGrid />
      {Array.from(groups.entries()).map(([assetKind, groupObjects]) => (
        <AssetInstanceGroup
          key={assetKind}
          assetKind={assetKind}
          objects={groupObjects}
          selectedIds={selectedIds}
          onSelectRef={handleSelectRef}
          onSelect={handleSelect}
        />
      ))}
      {gizmoTarget && singleSelectedId && (
        <SelectionGizmo target={gizmoTarget} objectId={singleSelectedId} />
      )}
    </>
  );
}
