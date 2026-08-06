import { nanoid } from "nanoid";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

import { createSceneObject } from "@/features/editor/lib/createSceneObject";
import type { SceneObject, SceneObjectDraft, TransformMode, Vector3Tuple } from "@/features/editor/types";

const MAX_HISTORY = 100;
const CLIPBOARD_OFFSET: Vector3Tuple = [2, 0, 2];

interface SceneSnapshot {
  objects: Record<string, SceneObject>;
  objectOrder: string[];
}

interface EditorState {
  objects: Record<string, SceneObject>;
  objectOrder: string[]; // render/list order, since object insertion order matters for layers
  selectedIds: string[];
  transformMode: TransformMode;
  clipboard: SceneObject[];
  past: SceneSnapshot[];
  future: SceneSnapshot[];

  // Object CRUD
  addObject: (draft: SceneObjectDraft) => string;
  updateObject: (id: string, patch: Partial<Omit<SceneObject, "id">>) => void;
  removeObjects: (ids: string[]) => void;

  // Selection
  select: (id: string, options?: { additive?: boolean }) => void;
  selectMany: (ids: string[]) => void;
  clearSelection: () => void;
  setTransformMode: (mode: TransformMode) => void;

  // Clipboard / high-level ops driven by keyboard shortcuts or the AI assistant
  copySelected: () => void;
  pasteClipboard: () => void;
  duplicateSelected: () => void;
  deleteSelected: () => void;

  // History
  undo: () => void;
  redo: () => void;

  // Bulk load (used by persistence layer / AI assistant executor)
  loadScene: (objects: SceneObject[]) => void;
  reset: () => void;
}

function snapshotOf(state: EditorState): SceneSnapshot {
  return { objects: state.objects, objectOrder: state.objectOrder };
}

export const useEditorStore = create<EditorState>()(
  immer((set, get) => ({
    objects: {},
    objectOrder: [],
    selectedIds: [],
    transformMode: "translate",
    clipboard: [],
    past: [],
    future: [],

    addObject: (draft) => {
      const object = createSceneObject(draft);
      set((state) => {
        state.past.push(snapshotOf(state));
        if (state.past.length > MAX_HISTORY) state.past.shift();
        state.future = [];
        state.objects[object.id] = object;
        state.objectOrder.push(object.id);
        state.selectedIds = [object.id];
      });
      return object.id;
    },

    updateObject: (id, patch) => {
      set((state) => {
        if (!state.objects[id]) return;
        state.past.push(snapshotOf(state));
        if (state.past.length > MAX_HISTORY) state.past.shift();
        state.future = [];
        Object.assign(state.objects[id], patch, { updatedAt: Date.now() });
      });
    },

    removeObjects: (ids) => {
      const idSet = new Set(ids);
      set((state) => {
        if (!ids.some((id) => state.objects[id])) return;
        state.past.push(snapshotOf(state));
        if (state.past.length > MAX_HISTORY) state.past.shift();
        state.future = [];
        for (const id of ids) delete state.objects[id];
        state.objectOrder = state.objectOrder.filter((id) => !idSet.has(id));
        state.selectedIds = state.selectedIds.filter((id) => !idSet.has(id));
      });
    },

    select: (id, options) => {
      set((state) => {
        if (options?.additive) {
          if (state.selectedIds.includes(id)) {
            state.selectedIds = state.selectedIds.filter((existing) => existing !== id);
          } else {
            state.selectedIds.push(id);
          }
        } else {
          state.selectedIds = [id];
        }
      });
    },

    selectMany: (ids) => {
      set((state) => {
        state.selectedIds = ids;
      });
    },

    clearSelection: () => {
      set((state) => {
        state.selectedIds = [];
      });
    },

    setTransformMode: (mode) => {
      set((state) => {
        state.transformMode = mode;
      });
    },

    copySelected: () => {
      const { objects, selectedIds } = get();
      set((state) => {
        state.clipboard = selectedIds.map((id) => objects[id]).filter(Boolean);
      });
    },

    pasteClipboard: () => {
      const { clipboard } = get();
      if (clipboard.length === 0) return;
      set((state) => {
        state.past.push(snapshotOf(state));
        if (state.past.length > MAX_HISTORY) state.past.shift();
        state.future = [];
        const newIds: string[] = [];
        for (const source of clipboard) {
          const id = nanoid();
          const now = Date.now();
          state.objects[id] = {
            ...source,
            id,
            name: `${source.name} copy`,
            position: [
              source.position[0] + CLIPBOARD_OFFSET[0],
              source.position[1] + CLIPBOARD_OFFSET[1],
              source.position[2] + CLIPBOARD_OFFSET[2],
            ],
            createdAt: now,
            updatedAt: now,
          };
          state.objectOrder.push(id);
          newIds.push(id);
        }
        state.selectedIds = newIds;
      });
    },

    duplicateSelected: () => {
      get().copySelected();
      get().pasteClipboard();
    },

    deleteSelected: () => {
      get().removeObjects(get().selectedIds);
    },

    undo: () => {
      set((state) => {
        const previous = state.past.pop();
        if (!previous) return;
        state.future.push(snapshotOf(state));
        state.objects = previous.objects;
        state.objectOrder = previous.objectOrder;
        state.selectedIds = state.selectedIds.filter((id) => previous.objects[id]);
      });
    },

    redo: () => {
      set((state) => {
        const next = state.future.pop();
        if (!next) return;
        state.past.push(snapshotOf(state));
        state.objects = next.objects;
        state.objectOrder = next.objectOrder;
        state.selectedIds = state.selectedIds.filter((id) => next.objects[id]);
      });
    },

    loadScene: (objects) => {
      set((state) => {
        state.objects = Object.fromEntries(objects.map((object) => [object.id, object]));
        state.objectOrder = objects.map((object) => object.id);
        state.selectedIds = [];
        state.past = [];
        state.future = [];
      });
    },

    reset: () => {
      set((state) => {
        state.objects = {};
        state.objectOrder = [];
        state.selectedIds = [];
        state.past = [];
        state.future = [];
        state.clipboard = [];
      });
    },
  })),
);

export const selectSceneObjects = (state: EditorState): SceneObject[] =>
  state.objectOrder.map((id) => state.objects[id]).filter(Boolean);
