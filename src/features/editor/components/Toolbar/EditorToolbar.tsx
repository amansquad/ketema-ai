"use client";

import { ChartColumn, Copy, Move, Redo2, RotateCw, Scaling, Trash2, Undo2 } from "lucide-react";
import type { ComponentType, ReactNode } from "react";

import { useEditorStore } from "@/features/editor/store/useEditorStore";
import type { TransformMode } from "@/features/editor/types";

const TRANSFORM_MODES: { mode: TransformMode; label: string; Icon: ComponentType<{ className?: string }> }[] = [
  { mode: "translate", label: "Move (1)", Icon: Move },
  { mode: "rotate", label: "Rotate (2)", Icon: RotateCw },
  { mode: "scale", label: "Scale (3)", Icon: Scaling },
];

function ToolbarButton({
  onClick,
  disabled,
  active,
  title,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  title: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={`flex h-9 w-9 items-center justify-center rounded-md transition-colors ${
        active
          ? "bg-emerald-500 text-white"
          : "text-zinc-300 hover:bg-zinc-800 hover:text-white disabled:cursor-not-allowed disabled:text-zinc-600 disabled:hover:bg-transparent"
      }`}
    >
      {children}
    </button>
  );
}

export function EditorToolbar({ onOpenAnalytics }: { onOpenAnalytics: () => void }) {
  const transformMode = useEditorStore((state) => state.transformMode);
  const setTransformMode = useEditorStore((state) => state.setTransformMode);
  const undo = useEditorStore((state) => state.undo);
  const redo = useEditorStore((state) => state.redo);
  const canUndo = useEditorStore((state) => state.past.length > 0);
  const canRedo = useEditorStore((state) => state.future.length > 0);
  const duplicateSelected = useEditorStore((state) => state.duplicateSelected);
  const deleteSelected = useEditorStore((state) => state.deleteSelected);
  const hasSelection = useEditorStore((state) => state.selectedIds.length > 0);

  return (
    <div className="pointer-events-none absolute inset-x-0 top-4 z-10 flex flex-col items-center gap-2">
      <div className="pointer-events-auto flex items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-900/90 p-1 shadow-lg backdrop-blur">
        {TRANSFORM_MODES.map(({ mode, label, Icon }) => (
          <ToolbarButton
            key={mode}
            title={label}
            active={transformMode === mode}
            onClick={() => setTransformMode(mode)}
          >
            <Icon className="h-4 w-4" />
          </ToolbarButton>
        ))}

        <div className="mx-1 h-6 w-px bg-zinc-700" />

        <ToolbarButton title="Undo (Ctrl+Z)" onClick={undo} disabled={!canUndo}>
          <Undo2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton title="Redo (Ctrl+Shift+Z)" onClick={redo} disabled={!canRedo}>
          <Redo2 className="h-4 w-4" />
        </ToolbarButton>

        <div className="mx-1 h-6 w-px bg-zinc-700" />

        <ToolbarButton title="Duplicate (Ctrl+D)" onClick={duplicateSelected} disabled={!hasSelection}>
          <Copy className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton title="Delete (Del)" onClick={deleteSelected} disabled={!hasSelection}>
          <Trash2 className="h-4 w-4" />
        </ToolbarButton>

        <div className="mx-1 h-6 w-px bg-zinc-700" />

        <ToolbarButton title="City analytics" onClick={onOpenAnalytics}>
          <ChartColumn className="h-4 w-4" />
        </ToolbarButton>
      </div>
    </div>
  );
}
