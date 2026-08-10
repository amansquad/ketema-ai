"use client";

import { Grid } from "@react-three/drei";
import { useEffect, useRef } from "react";
import type { Material, Mesh } from "three";

// drei's GridMaterial is transparent but still writes depth (three.js defaults
// depthWrite to true), so its huge quad — near-coplanar with the ground at
// y=0.01 vs y=0 — z-fights with the ground plane at distance, making the whole
// ground shimmer as the camera moves. Disabling depth writes turns the grid
// into a pure overlay: it can never fight the ground, while depth-testing still
// hides its lines behind placed objects.
export function SceneGrid() {
  const gridRef = useRef<Mesh>(null);

  useEffect(() => {
    if (gridRef.current) (gridRef.current.material as Material).depthWrite = false;
  }, []);

  return (
    <Grid
      ref={gridRef}
      position={[0, 0.01, 0]}
      args={[2000, 2000]}
      cellSize={1}
      cellThickness={0.5}
      cellColor="#3d4a42"
      sectionSize={10}
      sectionThickness={1}
      sectionColor="#5b8c6e"
      fadeDistance={220}
      fadeStrength={1}
      infiniteGrid
    />
  );
}
