/**
 * Cheap preflight check — creates a throwaway canvas and asks for a WebGL
 * context without ever mounting a real R3F <Canvas>. Guards against
 * software-rendering / driver setups where actually rendering a scene would
 * crash the GPU process rather than throw a catchable JS error (which an
 * ErrorBoundary can't help with — the tab dies before React gets a chance).
 */
export function hasWebGLSupport(): boolean {
  if (typeof window === "undefined") return true; // SSR: assume yes, checked again on the client
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}
