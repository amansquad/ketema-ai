/**
 * Project ids that never touch the database — the "demo" scratch project
 * linked from the landing page runs the editor fully local-only without
 * auth. Persistence hooks skip their API calls for these ids entirely;
 * otherwise an unauthenticated browser fires a request that comes back 401
 * (noise in the console) before the hook silently falls back to local-only.
 */
export const LOCAL_ONLY_PROJECT_IDS = new Set(["demo"]);

export function isLocalOnlyProject(projectId: string): boolean {
  return LOCAL_ONLY_PROJECT_IDS.has(projectId);
}
