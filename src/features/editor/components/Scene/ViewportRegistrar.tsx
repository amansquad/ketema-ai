"use client";

import { useThree } from "@react-three/fiber";
import { useEffect } from "react";

import { registerViewport, unregisterViewport } from "@/features/editor/lib/viewport";

// Mounted once inside <Canvas>. Exposes the live camera + DOM element to
// the module-level viewport registry so drag-and-drop (a native DOM event,
// outside the R3F event system) can convert drop coordinates to world space.
export function ViewportRegistrar() {
  const camera = useThree((state) => state.camera);
  const domElement = useThree((state) => state.gl.domElement);

  useEffect(() => {
    const handle = { camera, domElement };
    registerViewport(handle);
    return () => unregisterViewport(handle);
  }, [camera, domElement]);

  return null;
}
