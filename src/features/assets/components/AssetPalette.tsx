"use client";

import { useState } from "react";

import { AssetIcon } from "@/features/assets/components/AssetIcon";
import { CATEGORY_LABELS, catalogByCategory, type AssetCatalogEntry } from "@/features/assets/catalog/catalog";
import { ASSET_DRAG_MIME } from "@/features/assets/lib/dnd";
import { useEditorStore } from "@/features/editor/store/useEditorStore";

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
        // want to drag: spawns near the origin with a little jitter so
        // repeated clicks don't stack objects exactly on top of each other.
        const jitter = () => (Math.random() - 0.5) * 6;
        addObject({ assetKind: entry.kind, name: entry.label, position: [jitter(), 0, jitter()] });
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

  return (
    <aside
      className={`pointer-events-auto absolute top-4 left-4 z-10 flex max-h-[calc(100%-2rem)] flex-col overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/90 shadow-lg backdrop-blur transition-[width] ${
        collapsed ? "w-11" : "w-64"
      }`}
    >
      <button
        type="button"
        onClick={() => setCollapsed((value) => !value)}
        className="flex shrink-0 items-center justify-between border-b border-zinc-800 px-3 py-2.5 text-xs font-semibold tracking-wide text-zinc-400 uppercase hover:text-white"
      >
        {!collapsed && <span>Asset library</span>}
        <span aria-hidden>{collapsed ? "›" : "‹"}</span>
      </button>

      {!collapsed && (
        <div className="overflow-y-auto p-2">
          {Array.from(CATEGORY_ORDER.entries()).map(([category, entries]) => (
            <div key={category} className="mb-3 last:mb-0">
              <p className="px-2.5 pb-1 text-[11px] font-semibold tracking-wide text-zinc-500 uppercase">
                {CATEGORY_LABELS[category]}
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
