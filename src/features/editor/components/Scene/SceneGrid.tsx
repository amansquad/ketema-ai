"use client";

import { Grid } from "@react-three/drei";

export function SceneGrid() {
  return (
    <Grid
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
