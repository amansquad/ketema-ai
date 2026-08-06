"use client";

import { Leva } from "leva";

import { EditorCanvas } from "@/features/editor/components/Scene/EditorCanvas";
import { EditorToolbar } from "@/features/editor/components/Toolbar/EditorToolbar";
import { useEditorKeyboardShortcuts } from "@/features/editor/hooks/useEditorKeyboardShortcuts";

export function EditorShell() {
  useEditorKeyboardShortcuts();

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-zinc-950">
      <EditorCanvas />
      <EditorToolbar />

      <div className="pointer-events-none absolute bottom-4 left-4 rounded-md border border-zinc-800 bg-zinc-900/80 px-3 py-2 text-xs text-zinc-400 backdrop-blur">
        Shift+click to multi-select · Del to delete · Ctrl+D duplicate · Ctrl+Z/Y undo/redo
      </div>

      {process.env.NODE_ENV === "development" && (
        <Leva collapsed titleBar={{ title: "Ketema AI — Debug" }} />
      )}
    </div>
  );
}
