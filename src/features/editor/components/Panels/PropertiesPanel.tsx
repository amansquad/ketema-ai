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
import { getAssetParts } from "@/features/editor/lib/assetVisuals";
import type { SceneObject, Vector3Tuple } from "@/features/editor/types";
import { useTranslation } from "@/features/i18n/lib/useTranslation";

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
    <aside className="pointer-events-auto absolute top-4 right-4 z-10 w-72 max-w-[calc(100vw-2rem)] rounded-lg border border-zinc-800 bg-zinc-900/90 px-3 py-4 text-center text-xs text-zinc-500 shadow-lg backdrop-blur">
      {message}
    </aside>
  );
}

export function PropertiesPanel() {
  const { t } = useTranslation();
  const selectedIds = useEditorStore((state) => state.selectedIds);
  const selectedId = selectedIds.length === 1 ? selectedIds[0] : null;
  const object = useEditorStore((state) => (selectedId ? state.objects[selectedId] : undefined));

  if (selectedIds.length === 0) {
    return <EmptyState message={t.properties.selectPrompt} />;
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
  const { t } = useTranslation();
  const updateObject = useEditorStore((state) => state.updateObject);
  const [draft, setDraft] = useState<SceneObject>(object);

  const catalogEntry = getCatalogEntry(draft.assetKind);
  const parts = getAssetParts(catalogEntry.kind);

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
    <aside className="pointer-events-auto absolute top-4 right-4 z-10 max-h-[calc(100%-2rem)] w-72 max-w-[calc(100vw-2rem)] overflow-y-auto rounded-lg border border-zinc-800 bg-zinc-900/90 shadow-lg backdrop-blur">
      <PanelSection title={t.properties.object}>
        <p className="mb-2 text-[11px] text-zinc-500">{catalogEntry.label}</p>
        <TextField
          label={t.properties.name}
          value={draft.name}
          onChange={(value) => patchLocal({ name: value })}
          onCommit={commit}
        />
      </PanelSection>

      <PanelSection title={t.properties.transform}>
        <Vector3Row
          label={t.properties.position}
          values={draft.position}
          onChange={(index, value) => {
            const next: Vector3Tuple = [...draft.position];
            next[index] = value;
            patchLocal({ position: next });
          }}
          onCommit={commit}
        />
        <Vector3Row
          label={t.properties.rotation}
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
          label={t.properties.scale}
          values={draft.scale}
          onChange={(index, value) => {
            const next: Vector3Tuple = [...draft.scale];
            next[index] = Math.max(0.01, value);
            patchLocal({ scale: next });
          }}
          onCommit={commit}
        />
      </PanelSection>

      <PanelSection title={t.properties.material}>
        <ColorField
          label={t.properties.color}
          value={draft.material.color}
          onCommit={(color) => commitNow({ material: { ...draft.material, color } })}
        />
        <SliderField
          label={t.properties.roughness}
          value={draft.material.roughness}
          onCommit={(roughness) => commitNow({ material: { ...draft.material, roughness } })}
        />
        <SliderField
          label={t.properties.metalness}
          value={draft.material.metalness}
          onCommit={(metalness) => commitNow({ material: { ...draft.material, metalness } })}
        />
      </PanelSection>

      <PanelSection title="Part Colors">
        {parts.map((part) => (
          <ColorField
            key={part.id}
            label={part.id}
            value={draft.partColors?.[part.id] ?? (part.color ?? draft.material.color)}
            onCommit={(color) =>
              commitNow({
                partColors: { ...draft.partColors, [part.id]: color },
              })
            }
          />
        ))}
      </PanelSection>

      <PanelSection title={t.properties.tags}>
        <TagsEditor tags={draft.tags} onChange={(tags) => commitNow({ tags })} />
      </PanelSection>

      <PanelSection title={t.properties.metadata}>
        <MetadataEditor metadata={draft.metadata} onChange={(metadata) => commitNow({ metadata })} />
      </PanelSection>
    </aside>
  );
}
