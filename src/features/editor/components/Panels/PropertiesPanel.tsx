"use client";

import { useState } from "react";

import { getCatalogEntry } from "@/features/assets/catalog/catalog";
import {
  ColorField,
  PanelSection,
  SliderField,
  TextField,
  Vector3Row,
} from "@/features/editor/components/Panels/fields";
import { MetadataEditor } from "@/features/editor/components/Panels/MetadataEditor";
import { TagsEditor } from "@/features/editor/components/Panels/TagsEditor";
import { useEditorStore } from "@/features/editor/store/useEditorStore";
import type { SceneObject, Vector3Tuple } from "@/features/editor/types";

const RAD_TO_DEG = 180 / Math.PI;
const DEG_TO_RAD = Math.PI / 180;

function toDegrees(radians: Vector3Tuple): Vector3Tuple {
  return [radians[0] * RAD_TO_DEG, radians[1] * RAD_TO_DEG, radians[2] * RAD_TO_DEG];
}

function toRadians(degrees: Vector3Tuple): Vector3Tuple {
  return [degrees[0] * DEG_TO_RAD, degrees[1] * DEG_TO_RAD, degrees[2] * DEG_TO_RAD];
}

function EmptyState({ message }: { message: string }) {
  return (
    <aside className="pointer-events-auto absolute top-4 right-4 z-10 w-72 rounded-lg border border-zinc-800 bg-zinc-900/90 px-3 py-4 text-center text-xs text-zinc-500 shadow-lg backdrop-blur">
      {message}
    </aside>
  );
}

export function PropertiesPanel() {
  const selectedIds = useEditorStore((state) => state.selectedIds);
  const selectedId = selectedIds.length === 1 ? selectedIds[0] : null;
  const object = useEditorStore((state) => (selectedId ? state.objects[selectedId] : undefined));

  if (selectedIds.length === 0) {
    return <EmptyState message="Select an object to edit its properties." />;
  }

  if (selectedIds.length > 1) {
    return (
      <EmptyState message={`${selectedIds.length} objects selected. Use Ctrl+D to duplicate or Del to delete.`} />
    );
  }

  if (!object || !selectedId) return null;

  // Keying by selectedId remounts the form (fresh local draft state) whenever
  // the selection changes, instead of syncing via a useEffect + setState.
  return <PropertiesForm key={selectedId} selectedId={selectedId} object={object} />;
}

function PropertiesForm({ selectedId, object }: { selectedId: string; object: SceneObject }) {
  const updateObject = useEditorStore((state) => state.updateObject);
  const [draft, setDraft] = useState<SceneObject>(object);

  const catalogEntry = getCatalogEntry(draft.assetKind);

  function patchLocal(patch: Partial<SceneObject>) {
    setDraft((prev) => ({ ...prev, ...patch }));
  }

  // Commits whatever is currently in the local draft (already updated via
  // patchLocal on each field's onChange) — called on blur so undo/redo gets
  // one history entry per edit session instead of one per keystroke.
  function commit() {
    updateObject(selectedId, draft);
  }

  function commitNow(patch: Partial<SceneObject>) {
    patchLocal(patch);
    updateObject(selectedId, patch);
  }

  return (
    <aside className="pointer-events-auto absolute top-4 right-4 z-10 max-h-[calc(100%-2rem)] w-72 overflow-y-auto rounded-lg border border-zinc-800 bg-zinc-900/90 shadow-lg backdrop-blur">
      <PanelSection title="Object">
        <p className="mb-2 text-[11px] text-zinc-500">{catalogEntry.label}</p>
        <TextField
          label="Name"
          value={draft.name}
          onChange={(value) => patchLocal({ name: value })}
          onCommit={commit}
        />
      </PanelSection>

      <PanelSection title="Transform">
        <Vector3Row
          label="Position"
          values={draft.position}
          onChange={(index, value) => {
            const next: Vector3Tuple = [...draft.position];
            next[index] = value;
            patchLocal({ position: next });
          }}
          onCommit={commit}
        />
        <Vector3Row
          label="Rotation °"
          values={toDegrees(draft.rotation)}
          step={1}
          onChange={(index, value) => {
            const degrees = toDegrees(draft.rotation);
            degrees[index] = value;
            patchLocal({ rotation: toRadians(degrees) });
          }}
          onCommit={commit}
        />
        <Vector3Row
          label="Scale"
          values={draft.scale}
          onChange={(index, value) => {
            const next: Vector3Tuple = [...draft.scale];
            next[index] = Math.max(0.01, value);
            patchLocal({ scale: next });
          }}
          onCommit={commit}
        />
      </PanelSection>

      <PanelSection title="Material">
        <ColorField
          label="Color"
          value={draft.material.color}
          onCommit={(color) => commitNow({ material: { ...draft.material, color } })}
        />
        <SliderField
          label="Roughness"
          value={draft.material.roughness}
          onCommit={(roughness) => commitNow({ material: { ...draft.material, roughness } })}
        />
        <SliderField
          label="Metalness"
          value={draft.material.metalness}
          onCommit={(metalness) => commitNow({ material: { ...draft.material, metalness } })}
        />
      </PanelSection>

      <PanelSection title="Tags">
        <TagsEditor tags={draft.tags} onChange={(tags) => commitNow({ tags })} />
      </PanelSection>

      <PanelSection title="Metadata">
        <MetadataEditor metadata={draft.metadata} onChange={(metadata) => commitNow({ metadata })} />
      </PanelSection>
    </aside>
  );
}
