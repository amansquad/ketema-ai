"use client";

import { Leva } from "leva";
import { useState, type DragEvent } from "react";

import { AiAssistantPanel } from "@/features/ai-assistant/components/AiAssistantPanel";
import { AssetPalette } from "@/features/assets/components/AssetPalette";
import { ASSET_DRAG_MIME } from "@/features/assets/lib/dnd";
import { AnalyticsOverlay } from "@/features/dashboard/components/AnalyticsOverlay";
import { PropertiesPanel } from "@/features/editor/components/Panels/PropertiesPanel";
import { EditorCanvas } from "@/features/editor/components/Scene/EditorCanvas";
import { EditorToolbar } from "@/features/editor/components/Toolbar/EditorToolbar";
import { useEditorKeyboardShortcuts } from "@/features/editor/hooks/useEditorKeyboardShortcuts";
import { screenToGroundPoint } from "@/features/editor/lib/viewport";
import { useEditorStore } from "@/features/editor/store/useEditorStore";
import type { AssetKind } from "@/features/editor/types";
import { ShareButton } from "@/features/persistence/components/ShareButton";
import { useProjectSync } from "@/features/persistence/hooks/useProjectSync";
import { SimulationControlPanel } from "@/features/simulation/components/SimulationControlPanel";

// "demo" is the scratch project linked from the landing page — it never
// touches the database, so the editor works fully local-only without auth.
const LOCAL_ONLY_PROJECT_IDS = new Set(["demo"]);

export function EditorShell({ projectId }: { projectId: string }) {
  useEditorKeyboardShortcuts();
  useProjectSync(projectId);
  const addObject = useEditorStore((state) => state.addObject);
  const isPersistable = !LOCAL_ONLY_PROJECT_IDS.has(projectId);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);

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
      <EditorToolbar onOpenAnalytics={() => setAnalyticsOpen(true)} />
      <AssetPalette />
      <PropertiesPanel />
      {analyticsOpen && <AnalyticsOverlay onClose={() => setAnalyticsOpen(false)} />}

      <div className="pointer-events-none absolute bottom-4 left-4 flex flex-col items-start gap-2">
        <AiAssistantPanel />
        <div className="rounded-md border border-zinc-800 bg-zinc-900/80 px-3 py-2 text-xs text-zinc-400 backdrop-blur">
          Drag an asset onto the scene, or click to place it · Shift+click to multi-select · Del to
          delete · Ctrl+D duplicate · Ctrl+Z/Y undo/redo
        </div>
      </div>

      <div className="pointer-events-none absolute right-4 bottom-4 flex flex-col items-end gap-2">
        <SimulationControlPanel />
        {isPersistable && <ShareButton projectId={projectId} />}
      </div>

      {process.env.NODE_ENV === "development" && (
        <Leva collapsed titleBar={{ title: "Ketema AI — Debug" }} />
      )}
    </div>
  );
}
