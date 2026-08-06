"use client";

import { Plus, X } from "lucide-react";
import { useState } from "react";

import type { SceneObject } from "@/features/editor/types";

type MetadataRow = { key: string; value: string };

function toRows(metadata: SceneObject["metadata"]): MetadataRow[] {
  return Object.entries(metadata).map(([key, value]) => ({ key, value: String(value) }));
}

function toMetadata(rows: MetadataRow[]): SceneObject["metadata"] {
  const metadata: SceneObject["metadata"] = {};
  for (const row of rows) {
    const key = row.key.trim();
    if (key) metadata[key] = row.value;
  }
  return metadata;
}

// The parent (PropertiesPanel) mounts this with `key={selectedId}`, so a new
// selection naturally remounts it with fresh local state — no effect needed
// to "reset" rows when the selected object changes.
export function MetadataEditor({
  metadata,
  onChange,
}: {
  metadata: SceneObject["metadata"];
  onChange: (metadata: SceneObject["metadata"]) => void;
}) {
  const [rows, setRows] = useState<MetadataRow[]>(() => toRows(metadata));

  function updateRow(index: number, patch: Partial<MetadataRow>) {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function commit(nextRows: MetadataRow[]) {
    setRows(nextRows);
    onChange(toMetadata(nextRows));
  }

  return (
    <div className="flex flex-col gap-1.5">
      {rows.map((row, index) => (
        <div key={index} className="flex items-center gap-1">
          <input
            type="text"
            value={row.key}
            placeholder="key"
            onChange={(event) => updateRow(index, { key: event.target.value })}
            onBlur={() => commit(rows)}
            className="w-1/3 rounded-md border border-zinc-700 bg-zinc-800 px-1.5 py-1 text-xs text-zinc-100 outline-none focus:border-emerald-500"
          />
          <input
            type="text"
            value={row.value}
            placeholder="value"
            onChange={(event) => updateRow(index, { value: event.target.value })}
            onBlur={() => commit(rows)}
            className="flex-1 rounded-md border border-zinc-700 bg-zinc-800 px-1.5 py-1 text-xs text-zinc-100 outline-none focus:border-emerald-500"
          />
          <button
            type="button"
            onClick={() => commit(rows.filter((_, i) => i !== index))}
            className="rounded-md p-1 text-zinc-500 hover:bg-zinc-800 hover:text-white"
            aria-label="Remove field"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => setRows((prev) => [...prev, { key: "", value: "" }])}
        className="flex items-center gap-1 self-start rounded-md px-1.5 py-1 text-[11px] text-emerald-400 hover:bg-zinc-800"
      >
        <Plus className="h-3 w-3" /> Add field
      </button>
    </div>
  );
}
