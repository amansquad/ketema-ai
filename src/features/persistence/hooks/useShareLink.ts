"use client";

import { useMutation } from "@tanstack/react-query";

interface ShareLink {
  id: string;
  token: string;
  projectId: string;
}

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

export function useCreateShareLinkMutation() {
  return useMutation({
    mutationFn: (projectId: string) =>
      fetchJson<{ shareLink: ShareLink }>(`/api/projects/${projectId}/share`, { method: "POST" }),
  });
}

export function useRevokeShareLinkMutation() {
  return useMutation({
    mutationFn: (projectId: string) =>
      fetchJson<{ ok: true }>(`/api/projects/${projectId}/share`, { method: "DELETE" }),
  });
}
