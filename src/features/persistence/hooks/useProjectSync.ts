"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { useShallow } from "zustand/react/shallow";

import { selectSceneObjects, useEditorStore } from "@/features/editor/store/useEditorStore";
import type { SceneObject } from "@/features/editor/types";
import { isLocalOnlyProject } from "@/features/persistence/lib/localProjects";

const AUTOSAVE_DEBOUNCE_MS = 1500;

interface PersistedProject {
  id: string;
  scene: unknown;
}

async function fetchProject(id: string): Promise<PersistedProject | null> {
  const response = await fetch(`/api/projects/${id}`);
  if (!response.ok) return null;
  const data: { project: PersistedProject } = await response.json();
  return data.project;
}

async function saveProject(id: string, scene: SceneObject[]) {
  await fetch(`/api/projects/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ scene }),
  });
}

/**
 * Loads a project's saved scene into the editor store once, then autosaves
 * on every subsequent change (debounced). If `projectId` doesn't resolve to
 * a project the current user owns — not authenticated, Supabase/DB not
 * configured, or a scratch id like "demo" — this silently no-ops and the
 * editor just runs local-only, exactly like before persistence existed.
 */
export function useProjectSync(projectId: string) {
  const loadScene = useEditorStore((state) => state.loadScene);
  const objects = useEditorStore(useShallow(selectSceneObjects));
  const hasLoadedRef = useRef(false);
  const isPersistedRef = useRef(false);

  // Local-only ids (e.g. the "demo" scratch project) never hit the API — an
  // unauthenticated browser would otherwise fire a request that 401s before
  // the hook falls back to local-only. Real ids still resolve normally.
  const { data: project } = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => fetchProject(projectId),
    enabled: !isLocalOnlyProject(projectId),
    retry: false,
  });

  useEffect(() => {
    if (hasLoadedRef.current || !project) return;
    hasLoadedRef.current = true;
    isPersistedRef.current = true;
    const scene = Array.isArray(project.scene) ? (project.scene as SceneObject[]) : [];
    if (scene.length > 0) loadScene(scene);
  }, [project, loadScene]);

  useEffect(() => {
    if (!isPersistedRef.current) return;
    const timeout = setTimeout(() => {
      void saveProject(projectId, objects);
    }, AUTOSAVE_DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [objects, projectId]);
}
