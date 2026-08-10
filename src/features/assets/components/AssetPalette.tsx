"use client";

import { useState } from "react";

import { AssetIcon } from "@/features/assets/components/AssetIcon";
import { catalogByCategory, type AssetCatalogEntry, type AssetCategory } from "@/features/assets/catalog/catalog";
import { ASSET_DRAG_MIME } from "@/features/assets/lib/dnd";
import { findOpenSpot } from "@/features/editor/lib/placement";
import { cameraGroundPoint } from "@/features/editor/lib/viewport";
import { selectSceneObjects, useEditorStore } from "@/features/editor/store/useEditorStore";
import { useTranslation } from "@/features/i18n/lib/useTranslation";

const CATEGORY_ORDER = catalogByCategory();

function AssetCard({ entry }: { entry: AssetCatalogEntry }) {
  const addObject = useEditorStore((state) => state.addObject);

  return (
    <button
      type="button"
      draggable
      title={entry.description}
      onDragStart={(event) => {
        event.dataTransfer.setData(ASSET_DRAG_MIME, entry.kind);
        event.dataTransfer.effectAllowed = "copy";
      }}
      onClick={() => {
        // Click-to-place fallback for touch devices / mouse users who don't
        // want to drag: previously spawned near the world origin, which is
        // also where the seeded demo city sits — repeated clicks buried new
        // objects inside existing buildings at the city center. Instead,
        // start from a ground point in front of the current camera view and
        // nudge outward (see findOpenSpot) until it clears existing objects.
        const existing = selectSceneObjects(useEditorStore.getState());
        const anchor = cameraGroundPoint();
        const [x, z] = findOpenSpot(
          anchor ? [anchor.x, anchor.z] : [0, 0],
          existing.map((object) => [object.position[0], object.position[2]]),
        );
        addObject({ assetKind: entry.kind, name: entry.label, position: [x, 0, z] });
      }}
      className="flex w-full cursor-grab items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white active:cursor-grabbing"
    >
      <AssetIcon name={entry.iconName} className="h-4 w-4 shrink-0 text-emerald-400" />
      <span className="truncate">{entry.label}</span>
    </button>
  );
}

export function AssetPalette() {
  const [collapsed, setCollapsed] = useState(false);
  const { t } = useTranslation();
  const categoryLabels: Record<AssetCategory, string> = t.assetPalette.categories;

  return (
    <aside
      className={`pointer-events-auto absolute top-4 left-4 z-10 flex max-h-[calc(100%-2rem)] flex-col overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/90 shadow-lg backdrop-blur transition-[width] ${
        collapsed ? "w-11" : "w-64 max-w-[calc(100vw-2rem)]"
      }`}
    >
      <button
        type="button"
        onClick={() => setCollapsed((value) => !value)}
        className="flex shrink-0 items-center justify-between border-b border-zinc-800 px-3 py-2.5 text-xs font-semibold tracking-wide text-zinc-400 uppercase hover:text-white"
      >
        {!collapsed && <span>{t.assetPalette.title}</span>}
        <span aria-hidden>{collapsed ? "›" : "‹"}</span>
      </button>

      {!collapsed && (
        <div className="overflow-y-auto p-2">
          {Array.from(CATEGORY_ORDER.entries()).map(([category, entries]) => (
            <div key={category} className="mb-3 last:mb-0">
              <p className="px-2.5 pb-1 text-[11px] font-semibold tracking-wide text-zinc-500 uppercase">
                {categoryLabels[category]}
              </p>
              <div className="flex flex-col gap-0.5">
                {entries.map((entry) => (
                  <AssetCard key={entry.kind} entry={entry} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </aside>
  );
}
