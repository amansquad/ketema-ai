"use client";

import { useEffect } from "react";

import { useEditorStore } from "@/features/editor/store/useEditorStore";

function isTypingInField(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || target.isContentEditable;
}

// Centralizes all editor keyboard shortcuts so the shortcut list documented
// in the UI (see EditorToolbar) stays a single source of truth.
export function useEditorKeyboardShortcuts() {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (isTypingInField(event.target)) return;

      const store = useEditorStore.getState();
      const isMeta = event.metaKey || event.ctrlKey;

      if (isMeta && event.key.toLowerCase() === "z") {
        event.preventDefault();
        if (event.shiftKey) store.redo();
        else store.undo();
        return;
      }

      if (isMeta && event.key.toLowerCase() === "y") {
        event.preventDefault();
        store.redo();
        return;
      }

      if (isMeta && event.key.toLowerCase() === "c") {
        event.preventDefault();
        store.copySelected();
        return;
      }

      if (isMeta && event.key.toLowerCase() === "v") {
        event.preventDefault();
        store.pasteClipboard();
        return;
      }

      if (isMeta && event.key.toLowerCase() === "d") {
        event.preventDefault();
        store.duplicateSelected();
        return;
      }

      if (event.key === "Delete" || event.key === "Backspace") {
        if (store.selectedIds.length === 0) return;
        event.preventDefault();
        store.deleteSelected();
        return;
      }

      if (event.key === "Escape") {
        store.clearSelection();
        return;
      }

      switch (event.key) {
        case "1":
          store.setTransformMode("translate");
          break;
        case "2":
          store.setTransformMode("rotate");
          break;
        case "3":
          store.setTransformMode("scale");
          break;
        default:
          break;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
}
