"use client";

import { Leva } from "leva";
import type { DragEvent } from "react";

import { AssetPalette } from "@/features/assets/components/AssetPalette";
import { ASSET_DRAG_MIME } from "@/features/assets/lib/dnd";
import { EditorCanvas } from "@/features/editor/components/Scene/EditorCanvas";
import { EditorToolbar } from "@/features/editor/components/Toolbar/EditorToolbar";
import { useEditorKeyboardShortcuts } from "@/features/editor/hooks/useEditorKeyboardShortcuts";
import { useEditorStore } from "@/features/editor/store/useEditorStore";
import { screenToGroundPoint } from "@/features/editor/lib/viewport";
import type { AssetKind } from "@/features/editor/types";

export function EditorShell() {
  useEditorKeyboardShortcuts();
  const addObject = useEditorStore((state) => state.addObject);

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    if (!event.dataTransfer.types.includes(ASSET_DRAG_MIME)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    const assetKind = event.dataTransfer.getData(ASSET_DRAG_MIME) as AssetKind | "";
    if (!assetKind) return;
    event.preventDefault();

    const point = screenToGroundPoint(event.clientX, event.clientY);
    addObject({ assetKind, position: point ? [point.x, 0, point.z] : [0, 0, 0] });
  }

  return (
    <div
      className="relative h-dvh w-full overflow-hidden bg-zinc-950"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <EditorCanvas />
      <EditorToolbar />
      <AssetPalette />

      <div className="pointer-events-none absolute bottom-4 left-4 rounded-md border border-zinc-800 bg-zinc-900/80 px-3 py-2 text-xs text-zinc-400 backdrop-blur">
        Drag an asset onto the scene, or click to place it · Shift+click to multi-select · Del to
        delete · Ctrl+D duplicate · Ctrl+Z/Y undo/redo
      </div>

      {process.env.NODE_ENV === "development" && (
        <Leva collapsed titleBar={{ title: "Ketema AI — Debug" }} />
      )}
    </div>
  );
}
