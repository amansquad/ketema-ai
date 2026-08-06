"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export interface ProjectSummary {
  id: string;
  name: string;
  description: string | null;
  thumbnailUrl: string | null;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export const PROJECTS_QUERY_KEY = ["projects"] as const;

async function fetchJson<T>(input: string, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed (${response.status})`);
  }
  return response.json();
}

export function useProjectsQuery(initialProjects?: ProjectSummary[]) {
  return useQuery({
    queryKey: PROJECTS_QUERY_KEY,
    queryFn: () => fetchJson<{ projects: ProjectSummary[] }>("/api/projects").then((data) => data.projects),
    initialData: initialProjects,
  });
}

export function useCreateProjectMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      fetchJson<{ project: ProjectSummary }>("/api/projects", {
        method: "POST",
        body: JSON.stringify({ name }),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PROJECTS_QUERY_KEY }),
  });
}

export function useDeleteProjectMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => fetchJson<{ ok: true }>(`/api/projects/${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PROJECTS_QUERY_KEY }),
  });
}
